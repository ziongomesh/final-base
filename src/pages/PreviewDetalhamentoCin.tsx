import RgDetalhamento from "@/components/rg/RgDetalhamento";

const exemploData = {
  nome: "MARIA VIRGÍNIA DE ALBUQUERQUE CRUZ",
  nomeSocial: "",
  cpf: "233.333.213-31",
  genero: "MASCULINO",
  dataNascimento: "02/02/2002",
  nacionalidade: "BRA",
  naturalidade: "SAO PAULO",
  validade: "16/10/2035",
  mae: "SILVANE MARIANO DE OLIVEIRA",
  pai: "MANOEL JERÔNIMO DA SILVA",
  orgaoExpedidor: "SSP",
  localEmissao: "AL",
  dataEmissao: "16/10/2025",
  foto: null,
};

export default function PreviewDetalhamentoCin() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <RgDetalhamento data={exemploData} />
    </div>
  );
}
