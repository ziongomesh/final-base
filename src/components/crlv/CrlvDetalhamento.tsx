interface CrlvDetalhamentoProps {
  data: {
    codSegCla?: string;
    numeroCrv?: string;
    uf?: string;
    renavam?: string;
    rntrc?: string;
    exercicio?: string;
    nome?: string;
    cpfCnpj?: string;
    placa?: string;
    chassi?: string;
    especieTipo?: string;
    carroceria?: string;
    combustivel?: string;
    anoFab?: string;
    anoMod?: string;
    marcaModelo?: string;
    lotacao?: string;
    potencia?: string;
    cilindradas?: string;
    categoria?: string;
    cor?: string;
    motor?: string;
    capacidade?: string;
    pesoBruto?: string;
    cmt?: string;
    eixos?: string;
    local?: string;
    dataEmissao?: string;
    observacoes?: string;
  };
}

export default function CrlvDetalhamento({ data }: CrlvDetalhamentoProps) {
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

      {/* Subtitle */}
      <div style={{
        background: '#e8e8e8',
        padding: '1rem 1rem 0.8rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.5rem', color: '#333', fontWeight: 700, letterSpacing: 1 }}>CRLV Digital</h2>
        <p style={{ fontSize: '0.85rem', color: '#999' }}>SENATRAN</p>
      </div>

      {/* Content */}
      <div style={{ padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <Field label="Código de Segurança do CLA" value={data.codSegCla} />
        <Field label="Número do CRV" value={data.numeroCrv} />
        <Field label="UF" value={data.uf} />
        <Field label="Renavam" value={data.renavam} />
        <Field label="RNTRC" value={data.rntrc} />
        <Field label="Exercício" value={data.exercicio} />
        <Field label="Nome" value={data.nome} />
        <Field label="CPF/CNPJ" value={data.cpfCnpj} />
        <Field label="Placa" value={data.placa} />
        <Field label="Chassi" value={data.chassi} />
        <Field label="Espécie" value={data.especieTipo} />
        <Field label="Tipo" value={data.especieTipo} />
        <Field label="Carroceria" value={data.carroceria} />
        <Field label="Combustível" value={data.combustivel} />
        <Field label="Ano Fabricação" value={data.anoFab} />
        <Field label="Ano Modelo" value={data.anoMod} />
        <Field label="Marca Modelo" value={data.marcaModelo} />
        <Field label="Lotação" value={data.lotacao} />
        <Field label="Potência" value={data.potencia} />
        <Field label="Cilindradas" value={data.cilindradas} />
        <Field label="Categoria" value={data.categoria} />
        <Field label="Cor" value={data.cor} />
        <Field label="Motor" value={data.motor} />
        <Field label="Capacidade Máxima de Carga" value={data.capacidade} />
        <Field label="Peso Bruto Total" value={data.pesoBruto} />
        <Field label="Capacidade Máxima de Tração" value={data.cmt} />
        <Field label="Eixos" value={data.eixos} />
        <Field label="Local" value={data.local} />
        <Field label="Data de Emissão" value={data.dataEmissao} />
        <Field label="Observações" value={data.observacoes} />
      </div>
    </div>
  );
}
