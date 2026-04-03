import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RgDetalhamento from "@/components/rg/RgDetalhamento";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'https://datasistemas.online/api';

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  const s = String(d).substring(0, 10);
  if (s.includes('-')) {
    const [y, m, day] = s.split('-');
    return `${day}/${m}/${y}`;
  }
  return s;
}

export default function VerificarCin() {
  const [searchParams] = useSearchParams();
  const cpf = searchParams.get("cpf");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Alterar título e favicon da aba
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
      setError("CPF não informado.");
      setLoading(false);
      return;
    }

    const cleanCpf = String(cpf).replace(/\D/g, "");
    const runtimeOriginApi = typeof window !== 'undefined'
      ? `${window.location.origin.replace(/\/$/, '')}/api`
      : '';
    const candidates = [
      runtimeOriginApi,
      API_URL,
      "https://datasistemas.online/api",
    ].filter((v, i, arr) => !!v && arr.indexOf(v) === i);

    (async () => {
      let lastError = "";

      for (const base of candidates) {
        try {
          const res = await fetch(`${base}/verify-cin?cpf=${encodeURIComponent(cleanCpf)}`);

          if (!res.ok) {
            lastError = `endpoint ${base} retornou ${res.status}`;
            continue;
          }

          const result = await res.json();
          setData({
            nome: result.nome,
            nomeSocial: result.nome_social,
            cpf: result.cpf,
            genero: result.genero,
            dataNascimento: formatDate(result.data_nascimento),
            nacionalidade: result.nacionalidade,
            naturalidade: result.naturalidade,
            validade: formatDate(result.validade),
            mae: result.mae,
            pai: result.pai,
            orgaoExpedidor: result.orgao_expedidor,
            localEmissao: result.local_emissao,
            dataEmissao: formatDate(result.data_emissao),
            foto: result.foto_url,
          });

          setError("");
          return;
        } catch (err: any) {
          lastError = err?.message || "falha de rede";
        }
      }

      console.error("[VerificarCin] Falha em todos os endpoints:", lastError);
      setError("RG/CIN não encontrado ou link inválido.");
    })().finally(() => setLoading(false));
  }, [cpf]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#609D46' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Roboto", sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem' }}>⚠️ {error}</h2>
          <p style={{ color: '#999' }}>Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <RgDetalhamento data={data} />
    </div>
  );
}
