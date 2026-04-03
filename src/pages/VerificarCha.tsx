import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { isUsingMySQL } from '@/lib/db-config';
import { supabase } from '@/integrations/supabase/client';

interface ChaData {
  nome: string;
  cpf: string;
  data_nascimento: string | null;
  categoria: string | null;
  validade: string | null;
  emissao: string | null;
  numero_inscricao: string | null;
  limite_navegacao: string | null;
  orgao_emissao: string | null;
  foto: string | null;
  hash: string | null;
}

function generateHash(senha: string, cpf: string, numInscricao: string): string {
  const hashStr = (senha || '') + cpf + (numInscricao || '');
  let hash = '';
  for (let i = 0; i < hashStr.length; i++) {
    hash += hashStr.charCodeAt(i).toString(16).toUpperCase();
  }
  return hash.substring(0, 40);
}

function formatCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatDate(d: string | null): string | null {
  if (!d) return null;
  const s = String(d).substring(0, 10);
  if (s.includes('-')) {
    const [y, m, day] = s.split('-');
    return `${day}/${m}/${y}`;
  }
  return s;
}

export default function VerificarCha() {
  const [params] = useSearchParams();
  const cpf = params.get('cpf') || params.get('id') || '';
  const [data, setData] = useState<ChaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultaTime, setConsultaTime] = useState('');

  useEffect(() => {
    document.title = 'VIO';
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (link) {
      link.href = '/images/vio-icon-new.png';
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = '/images/vio-icon-new.png';
      document.head.appendChild(newLink);
    }
  }, []);

  useEffect(() => {
    if (!cpf) {
      setError('CPF não fornecido.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const cleanCpf = cpf.replace(/\D/g, '');

        if (isUsingMySQL()) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
          const response = await fetch(`${apiUrl}/verify-cha?cpf=${cleanCpf}`);
          if (!response.ok) {
            setError('Usuário não encontrado.');
            return;
          }
          const result = await response.json();
          setData(result);
        } else {
          // Query Supabase directly
          const { data: record, error: dbError } = await supabase
            .from('chas')
            .select('*')
            .eq('cpf', cleanCpf)
            .maybeSingle();

          if (dbError || !record) {
            setError('Usuário não encontrado.');
            return;
          }

          setData({
            nome: record.nome,
            cpf: formatCpf(cleanCpf),
            data_nascimento: formatDate(record.data_nascimento),
            categoria: record.categoria,
            validade: record.validade,
            emissao: record.emissao,
            numero_inscricao: record.numero_inscricao,
            limite_navegacao: record.limite_navegacao,
            orgao_emissao: record.orgao_emissao,
            foto: record.foto,
            hash: generateHash(record.senha || '', cleanCpf, record.numero_inscricao || ''),
          });
        }

        const now = new Date();
        setConsultaTime(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      } catch {
        setError('Erro ao consultar documento.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cpf]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-[#609D46]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const fotoSrc = data.foto
    ? data.foto.startsWith('http') ? data.foto : `${window.location.origin}${data.foto}`
    : null;

  const fields = [
    { label: 'Nome (Name)', value: data.nome },
    { label: 'Data do Nascimento (Date of Birth)', value: data.data_nascimento },
    { label: 'CPF (Individual registration)', value: data.cpf },
    { label: 'Categoria (Category)', value: data.categoria },
    { label: 'Data de validade (Expiration date)', value: data.validade },
    { label: 'N⁰ de Inscrição (Registration number)', value: data.numero_inscricao },
    { label: 'Limites da Navegação (Navigation Limits)', value: data.limite_navegacao },
    { label: 'Órgão Emissor (Issuer)', value: data.orgao_emissao },
    { label: 'Data de Emissão (Issue Date)', value: data.emissao },
    { label: 'Hash', value: data.hash },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-[Roboto,sans-serif]" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="flex justify-between items-center bg-[#96CA71] px-4 py-3">
        <div className="flex items-center gap-6">
          <ArrowLeft className="text-white w-6 h-6" />
          <h1 className="text-white text-xl font-bold">Detalhamento</h1>
        </div>
        <Info className="text-white w-6 h-6" />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-4 py-6 gap-4 bg-white">
        <h2 style={{ fontSize: '1.35rem', color: '#333', fontWeight: 700, letterSpacing: 0.3, textAlign: 'left', width: '100%' }}>CHA - Carteira de Habilitação de Amador</h2>
        <p style={{ fontSize: '0.85rem', color: '#609D46', marginTop: '-4px', textAlign: 'center', width: '100%' }}>Marinha do Brasil</p>

        {/* Photo */}
        {fotoSrc ? (
          <div className="w-32 h-40 rounded-lg overflow-hidden border border-gray-200 mt-2">
            <img src={fotoSrc} alt="Foto" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-32 h-40 rounded-lg bg-gray-100 border border-gray-200 mt-2 flex items-center justify-center">
            <span className="text-gray-400 text-xs">Sem foto</span>
          </div>
        )}

        {/* Fields */}
        <div className="w-full flex flex-col gap-4 mt-4">
          {fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-1">
              <p className="text-xs text-[#609D46]">{f.label}</p>
              <strong className="text-base text-gray-900 uppercase border-b border-gray-300/60 pb-1 min-h-[1.4rem] overflow-hidden break-words">
                {f.value || '—'}
              </strong>
            </div>
          ))}
        </div>

        {/* Documento Válido */}
        <div className="w-full mt-6 bg-[#e8f5e1] rounded-xl p-6 flex flex-col items-center gap-2 border border-[#96CA71]/30">
          <CheckCircle2 className="w-10 h-10" style={{ color: '#2e7d32' }} />
          <p style={{ color: '#2e7d32', fontWeight: 700, fontSize: '1.1rem' }}>DOCUMENTO VÁLIDO</p>
          <p className="text-sm text-gray-500">Consultado em: {consultaTime}</p>
        </div>
      </div>
    </div>
  );
}
