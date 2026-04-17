import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const transactionId = url.pathname.split('/').pop();
    
    if (!transactionId) {
      return new Response(JSON.stringify({ error: "Transaction ID não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Checking payment status for:', transactionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find payment
    const { data: payment, error: paymentError } = await supabase
      .from('pix_payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (paymentError || !payment) {
      console.error("❌ Pagamento não encontrado:", transactionId);
      return new Response(JSON.stringify({ error: "Pagamento não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se ainda está pendente, consulta VizzionPay para confirmar
    if (payment.status === 'PENDING') {
      console.log('🔄 Status PENDING, consultando VizzionPay...');
      
      const publicKey = Deno.env.get('VIZZIONPAY_PUBLIC_KEY');
      const privateKey = Deno.env.get('VIZZIONPAY_PRIVATE_KEY');
      
      if (publicKey && privateKey) {
        try {
          const vizzionResponse = await fetch(`https://app.vizzionpay.com.br/api/v1/gateway/transactions?id=${transactionId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-public-key': publicKey,
              'x-secret-key': privateKey,
            },
          });
          
          if (vizzionResponse.ok) {
            const vizzionData = await vizzionResponse.json();
            console.log('📦 VizzionPay response:', JSON.stringify(vizzionData, null, 2));
            
            const remoteEvent = vizzionData.event;
            const remoteStatus = vizzionData.status || vizzionData.transaction?.status;
            
            // Verifica se o pagamento foi confirmado
            const isPaid = remoteEvent === 'TRANSACTION_PAID' || 
                          remoteStatus === 'PAID' || 
                          remoteStatus === 'COMPLETED';
            
            if (isPaid) {
              console.log('✅ Pagamento confirmado via VizzionPay!');
              
              // Verifica se é pagamento de revendedor (prefixo RESELLER:)
              const isResellerPayment = payment.admin_name?.startsWith('RESELLER:');
              
              // Atualiza status para PAID
              const { error: updateError } = await supabase
                .from('pix_payments')
                .update({ status: 'PAID', paid_at: new Date().toISOString() })
                .eq('transaction_id', transactionId)
                .eq('status', 'PENDING'); // Evita duplicação
              
              if (updateError) {
                console.error('Erro ao atualizar status:', updateError);
              }
              
              // Se não é revendedor (compra de revenda), credita os créditos
              if (!isResellerPayment) {
                // Recarga em Dobro: só aplica em pacotes oficiais (PKG:), promoção ativa e revendedor
                let finalCredits = payment.credits;
                const isPackage = typeof payment.admin_name === 'string' && payment.admin_name.startsWith('PKG:');
                if (isPackage) {
                  const { data: settings } = await supabase
                    .from('platform_settings').select('recarga_em_dobro').eq('id', 1).single();
                  if (settings?.recarga_em_dobro) {
                    const { data: adminRow } = await supabase
                      .from('admins').select('rank').eq('id', payment.admin_id).single();
                    if (adminRow?.rank === 'revendedor') {
                      finalCredits = payment.credits * 2;
                      console.log(`🎁 Recarga em Dobro: ${payment.credits} → ${finalCredits}`);
                    }
                  }
                }

                const { error: rpcError } = await supabase.rpc('recharge_credits', {
                  p_admin_id: payment.admin_id,
                  p_amount: finalCredits,
                  p_unit_price: payment.amount / payment.credits,
                  p_total_price: payment.amount
                });
                
                if (rpcError) {
                  console.error('Erro ao adicionar créditos:', rpcError);
                } else {
                  console.log(`✅ ${finalCredits} créditos adicionados ao admin ${payment.admin_id}`);
                }
              }
              
              return new Response(JSON.stringify({
                status: 'PAID',
                transactionId: payment.transaction_id,
                amount: payment.amount,
                credits: payment.credits,
                createdAt: payment.created_at,
                paidAt: new Date().toISOString(),
                message: "Pagamento confirmado"
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        } catch (vizzionError) {
          console.error('Erro ao consultar VizzionPay:', vizzionError);
        }
      }
    }
    
    return new Response(JSON.stringify({
      status: payment.status,
      transactionId: payment.transaction_id,
      amount: payment.amount,
      credits: payment.credits,
      createdAt: payment.created_at,
      paidAt: payment.paid_at,
      message: payment.status === "PAID" ? "Pagamento confirmado" : "Pagamento pendente"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    return new Response(JSON.stringify({ error: "Erro ao verificar status do pagamento" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
