interface RgDetalhamentoProps {
  data: {
    nome?: string;
    nomeSocial?: string;
    cpf?: string;
    genero?: string;
    dataNascimento?: string;
    nacionalidade?: string;
    naturalidade?: string;
    validade?: string;
    mae?: string;
    pai?: string;
    orgaoExpedidor?: string;
    localEmissao?: string;
    dataEmissao?: string;
    foto?: string | null;
  };
}

export default function RgDetalhamento({ data }: RgDetalhamentoProps) {
  const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col gap-1 w-full">
      <p style={{ fontSize: '0.8rem', color: '#609D46' }}>{label}</p>
      <strong style={{
        minHeight: '1.4rem',
        fontSize: '1.1rem',
        overflow: 'hidden',
        textTransform: 'uppercase',
        borderBottom: '#A8A8A860 solid 1px',
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 700,
        display: 'block',
        paddingBottom: '4px',
        color: '#4a4a4a',
      }}>
        {value || ''}
      </strong>
    </div>
  );

  return (
    <div style={{
      fontFamily: '"Roboto", sans-serif',
      background: '#f5f5f5',
      overflow: 'hidden',
      width: '100%',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#96CA71',
        padding: '0.8rem 1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
          <span style={{ color: '#fff', fontSize: '1.2rem' }}>←</span>
          <h1 style={{ color: '#FFFEFF', fontSize: '1.3rem', fontWeight: 700 }}>Detalhamento</h1>
        </div>
        <span style={{ color: '#fff', fontSize: '1.1rem' }}>ⓘ</span>
      </div>

      {/* Content */}
      <div style={{ padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#333', fontWeight: 700, letterSpacing: 1 }}>RG Digital</h2>
        <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>GovBR</p>

        {/* Foto (no lugar da impressão digital) */}
        <div style={{
          width: 120, height: 140,
          border: '1px solid #ccc',
          borderRadius: 4,
          marginBottom: '1rem',
          overflow: 'hidden',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {data.foto ? (
            <img src={data.foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#ccc', fontSize: '2rem' }}>👤</span>
          )}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
          <Field label="Nome / Name" value={data.nome} />
          <Field label="Nome Social / Social Name" value={data.nomeSocial} />
          <Field label="Registro Geral-CPF / Personal Number" value={data.cpf} />
          <Field label="Sexo / Sex" value={data.genero} />
          <Field label="Data de Nascimento / Date of Birth" value={data.dataNascimento} />
          <Field label="Nacionalidade / Nationality" value={data.nacionalidade} />
          <Field label="Naturalidade / Place of Birth" value={data.naturalidade} />
          <Field label="Data de Validade / Date of Expiry" value={data.validade} />
          <Field label="Filiação / Filiation" value={data.mae} />
          <Field label="Filiação / Filiation" value={data.pai} />
          <Field label="Órgão Expedidor / Card Issuer" value={data.orgaoExpedidor} />
          <Field label="Local / Place of Issue" value={data.localEmissao} />
          <Field label="Data de Emissão / Issue Date" value={data.dataEmissao} />
        </div>
      </div>
    </div>
  );
}
