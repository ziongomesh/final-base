import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin_id, session_token } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate session
    const { data: valid } = await supabase.rpc('is_valid_admin', {
      p_admin_id: admin_id,
      p_session_token: session_token,
    });
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch photos from all modules
    const [cnhRes, rgRes, chaRes, estudanteRes] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, cpf, nome, foto_url, created_at')
        .eq('admin_id', admin_id)
        .not('foto_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('usuarios_rg')
        .select('id, cpf, nome, foto_url, assinatura_url, created_at')
        .eq('admin_id', admin_id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('chas')
        .select('id, cpf, nome, foto, created_at')
        .eq('admin_id', admin_id)
        .not('foto', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('carteira_estudante')
        .select('id, cpf, nome, perfil_imagem, created_at')
        .eq('admin_id', admin_id)
        .not('perfil_imagem', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const photos: Array<{ url: string; nome: string; cpf: string; modulo: string; created_at: string }> = [];
    const signatures: Array<{ url: string; nome: string; cpf: string; modulo: string; created_at: string }> = [];

    // CNH photos + signatures
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    if (cnhRes.data) {
      for (const u of cnhRes.data) {
        if (u.foto_url) {
          photos.push({ url: u.foto_url, nome: u.nome, cpf: u.cpf, modulo: 'CNH', created_at: u.created_at || '' });
        }
        // Try signature URL pattern
        const cleanCpf = u.cpf.replace(/\D/g, '');
        const sigUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${cleanCpf}assinatura.png`;
        signatures.push({ url: sigUrl, nome: u.nome, cpf: u.cpf, modulo: 'CNH', created_at: u.created_at || '' });
      }
    }

    // RG photos + signatures
    if (rgRes.data) {
      for (const r of rgRes.data) {
        if (r.foto_url) {
          photos.push({ url: r.foto_url, nome: r.nome, cpf: r.cpf, modulo: 'RG', created_at: r.created_at || '' });
        }
        if (r.assinatura_url) {
          signatures.push({ url: r.assinatura_url, nome: r.nome, cpf: r.cpf, modulo: 'RG', created_at: r.created_at || '' });
        }
      }
    }

    // CHA photos
    if (chaRes.data) {
      for (const c of chaRes.data) {
        if (c.foto) {
          photos.push({ url: c.foto, nome: c.nome, cpf: c.cpf, modulo: 'CHA', created_at: c.created_at || '' });
        }
      }
    }

    // Estudante photos
    if (estudanteRes.data) {
      for (const e of estudanteRes.data) {
        if (e.perfil_imagem) {
          photos.push({ url: e.perfil_imagem, nome: e.nome, cpf: e.cpf, modulo: 'Estudante', created_at: e.created_at || '' });
        }
      }
    }

    // Deduplicate by URL
    const seenPhotos = new Set<string>();
    const uniquePhotos = photos.filter(p => {
      if (seenPhotos.has(p.url)) return false;
      seenPhotos.add(p.url);
      return true;
    });

    const seenSigs = new Set<string>();
    const uniqueSigs = signatures.filter(s => {
      if (seenSigs.has(s.url)) return false;
      seenSigs.add(s.url);
      return true;
    });

    return new Response(JSON.stringify({ photos: uniquePhotos, signatures: uniqueSigs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
