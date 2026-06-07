import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CrafDetalhamento from "@/components/craf/CrafDetalhamento";
import { Loader2 } from "lucide-react";

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export default function VerificarCraf() {
  const [searchParams] = useSearchParams();
  const cpf = searchParams.get("cpf");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = 'VIO';
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (link) link.href = '/images/vio-icon-new.png';
  }, []);

  useEffect(() => {
    if (!cpf) { setError("CPF não informado."); setLoading(false); return; }
    const cleanCpf = String(cpf).replace(/\D/g, "");
    const runtimeOrigin = typeof window !== 'undefined' ? `${window.location.origin.replace(/\/$/, '')}/api` : '';
    const candidates = [runtimeOrigin, API_URL].filter((v, i, a) => !!v && a.indexOf(v) === i);

    (async () => {
      let lastErr = '';
      for (const base of candidates) {
        try {
          const res = await fetch(`${base}/verify-craf?cpf=${encodeURIComponent(cleanCpf)}`);
          if (!res.ok) { lastErr = `${base} -> ${res.status}`; continue; }
          const result = await res.json();
          setData(result);
          setError('');
          return;
        } catch (err: any) { lastErr = err?.message || 'erro'; }
      }
      console.error('[VerificarCraf] falha:', lastErr);
      setError('CRAF não encontrado ou link inválido.');
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
  return <CrafDetalhamento data={data} />;
}
