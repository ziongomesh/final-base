interface CrafDetalhamentoProps {
  data: {
    nome?: string;
    cpf?: string;
    rg?: string;
    sfpc_vinculacao?: string;
    amparo_legal?: string;
    registro?: string;
    tipo?: string;
    marca?: string;
    calibre?: string;
    n_serie?: string;
    n_sigma?: string;
    data_expedicao?: string;
    gac_emissora?: string;
    cidade_uf?: string;
    validade?: string;
    foto_url?: string;
  };
}

function resolveUrl(u?: string): string | null {
  if (!u) return null;
  if (/^https?:\/\//.test(u)) return u;
  const apiBase = (import.meta as any).env?.VITE_API_URL || '';
  const root = apiBase.replace(/\/api\/?$/, '');
  return `${root}${u.startsWith('/') ? u : `/${u}`}`;
}

export default function CrafDetalhamento({ data }: CrafDetalhamentoProps) {
  const fotoUrl = resolveUrl(data.foto_url);

  const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col gap-1 w-full">
      <p style={{ fontSize: '0.8rem', color: '#609D46' }}>{label}</p>
      <strong style={{
        minHeight: '1.4rem',
        fontSize: '1.1rem',
        textTransform: 'uppercase',
        borderBottom: '#A8A8A860 solid 1px',
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 700,
        paddingBottom: '4px',
        color: '#4a4a4a',
      }}>
        {value || ''}
      </strong>
    </div>
  );

  return (
    <div style={{ fontFamily: '"Roboto", sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#96CA71', padding: '0.8rem 1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
          <span style={{ color: '#fff', fontSize: '1.2rem' }}>←</span>
          <h1 style={{ color: '#FFFEFF', fontSize: '1.3rem', fontWeight: 700 }}>Detalhamento</h1>
        </div>
        <span style={{ color: '#fff', fontSize: '1.1rem' }}>ⓘ</span>
      </div>

      <div style={{ padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#333', fontWeight: 400, letterSpacing: 2 }}>CRAF-EXERCITO</h2>
        <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>Exercito</p>

        <div style={{
          width: 140, height: 160, border: '1px solid #ccc', borderRadius: 4,
          marginBottom: '1rem', overflow: 'hidden', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#ccc', fontSize: '2rem' }}>👤</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
          <Field label="Validade" value={data.validade} />
          <Field label="Nome Completo" value={data.nome} />
          <Field label="CPF" value={data.cpf} />
          <Field label="RG" value={data.rg} />
          <Field label="SFPC de Vinculação (RM)" value={data.sfpc_vinculacao} />
          <Field label="Amparo Legal" value={data.amparo_legal} />
          <Field label="Registro" value={data.registro} />
          <Field label="Tipo" value={data.tipo} />
          <Field label="Marca" value={data.marca} />
          <Field label="Calibre" value={data.calibre} />
          <Field label="Nº Série" value={data.n_serie} />
          <Field label="Nº SIGMA" value={data.n_sigma} />
          <Field label="Data Expedição" value={data.data_expedicao} />
          <Field label="GAC Emissora" value={data.gac_emissora} />
          <Field label="Cidade/UF" value={data.cidade_uf} />
        </div>
      </div>
    </div>
  );
}
