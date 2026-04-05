import CnhDetalhamento from "@/components/cnh/CnhDetalhamento";

const exemploData = {
  nome: "FELIPE DA SILVA PEREIRA LIMA",
  nomeCivil: "FELIPE PEREIRA",
  docIdentidade: "3123124 SSP/DF",
  cpf: "000.000.000-00",
  dataNascimento: "12/10/2000",
  pai: "NOME DO PAI",
  mae: "NOME DA MÃE",
  categoria: "AB",
  numeroRegistro: "00000000000",
  hab: "00/00/0000",
  obs: "99, EAR",
  localEmissao: "SÃO PAULO, SP",
  uf: "SP",
  dataEmissao: "00/00/0000",
  espelho: "00000000",
  renach: "SP000000000",
};

export default function PreviewDetalhamentoCnh() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <CnhDetalhamento data={exemploData} />
    </div>
  );
}
