// Utilitários para geração de dados da CNH

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre", capital: "Rio Branco" },
  { value: "AL", label: "Alagoas", capital: "Maceió" },
  { value: "AP", label: "Amapá", capital: "Macapá" },
  { value: "AM", label: "Amazonas", capital: "Manaus" },
  { value: "BA", label: "Bahia", capital: "Salvador" },
  { value: "CE", label: "Ceará", capital: "Fortaleza" },
  { value: "DF", label: "Distrito Federal", capital: "Brasília" },
  { value: "ES", label: "Espírito Santo", capital: "Vitória" },
  { value: "GO", label: "Goiás", capital: "Goiânia" },
  { value: "MA", label: "Maranhão", capital: "São Luís" },
  { value: "MT", label: "Mato Grosso", capital: "Cuiabá" },
  { value: "MS", label: "Mato Grosso do Sul", capital: "Campo Grande" },
  { value: "MG", label: "Minas Gerais", capital: "Belo Horizonte" },
  { value: "PA", label: "Pará", capital: "Belém" },
  { value: "PB", label: "Paraíba", capital: "João Pessoa" },
  { value: "PR", label: "Paraná", capital: "Curitiba" },
  { value: "PE", label: "Pernambuco", capital: "Recife" },
  { value: "PI", label: "Piauí", capital: "Teresina" },
  { value: "RJ", label: "Rio de Janeiro", capital: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte", capital: "Natal" },
  { value: "RS", label: "Rio Grande do Sul", capital: "Porto Alegre" },
  { value: "RO", label: "Rondônia", capital: "Porto Velho" },
  { value: "RR", label: "Roraima", capital: "Boa Vista" },
  { value: "SC", label: "Santa Catarina", capital: "Florianópolis" },
  { value: "SP", label: "São Paulo", capital: "São Paulo" },
  { value: "SE", label: "Sergipe", capital: "Aracaju" },
  { value: "TO", label: "Tocantins", capital: "Palmas" },
];

export { BRAZILIAN_STATES };

export const CNH_CATEGORIES = [
  'A', 'B', 'AB', 'AC', 'C', 'AD', 'D', 'AE', 'E'
];

export const CNH_OBSERVACOES = ['EAR', '99', 'MOPP', '15', 'A', 'D', 'E', 'F'];

// Gerador de números aleatórios
function randomDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) result += Math.floor(Math.random() * 10);
  return result;
}

export function generateRegistroCNH(): string {
  return randomDigits(11);
}

export function generateEspelhoNumber(): string {
  return randomDigits(11);
}

export function generateCodigoSeguranca(): string {
  return randomDigits(11);
}

export function generateRenach(uf: string): string {
  return `${uf || 'SP'}${randomDigits(9)}`;
}

export function generateMRZ(nome: string, maxLen: number = 27): string {
  if (!nome) return '';
  const parts = nome.toUpperCase().trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length === 0) return '';

  // Conteúdo útil max = maxLen - 1 para sempre ter pelo menos 1 < no final
  const contentMax = maxLen - 1;
  const pad = (s: string) => s + '<'.repeat(Math.max(1, maxLen - s.length));

  // 1 nome só
  if (parts.length === 1) return pad(parts[0]);

  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts.slice(1, -1);

  // Preposições comuns — abreviar para inicial
  const prepositions = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS']);

  // Tentar formato completo
  const full = parts.join('<<');
  if (full.length <= contentMax) return pad(full);

  // Estratégia: manter primeiro e último completos, abreviar meio progressivamente
  // Prioridade de abreviação: preposições primeiro, depois nomes curtos, depois longos
  const middleEntries = middle.map((m, i) => ({ word: m, index: i, isPrep: prepositions.has(m) }));

  // Começar com tudo completo no meio, ir abreviando um a um
  const currentMiddle = [...middle];

  // Fase 1: abreviar preposições para inicial
  for (let i = 0; i < currentMiddle.length; i++) {
    if (prepositions.has(middle[i])) {
      currentMiddle[i] = middle[i][0];
    }
  }
  let result = [first, ...currentMiddle, last].join('<<');
  if (result.length <= contentMax) return pad(result);

  // Fase 2: abreviar nomes do meio (menores primeiro) para inicial
  const sortedByLen = middleEntries
    .filter(e => !e.isPrep)
    .sort((a, b) => a.word.length - b.word.length);

  for (const entry of sortedByLen) {
    currentMiddle[entry.index] = middle[entry.index][0];
    result = [first, ...currentMiddle, last].join('<<');
    if (result.length <= contentMax) return pad(result);
  }

  // Fase 3: usar < simples entre iniciais em vez de <<
  // Manter primeiro<<...meio com < simples...<<último
  const middleStr = currentMiddle.join('<');
  result = first + '<<' + middleStr + '<<' + last;
  if (result.length <= contentMax) return pad(result);

  // Fase 4: remover nomes do meio um a um (do final para o início)
  for (let drop = currentMiddle.length; drop >= 1; drop--) {
    const kept = currentMiddle.slice(0, currentMiddle.length - drop);
    if (kept.length > 0) {
      result = first + '<<' + kept.join('<') + '<<' + last;
    } else {
      result = first + '<<' + last;
    }
    if (result.length <= contentMax) return pad(result);
  }

  // Último recurso: truncar
  result = first + '<<' + last;
  return result.slice(0, contentMax) + '<';
}

export function getStateFullName(uf: string): string {
  const state = BRAZILIAN_STATES.find(s => s.value === uf);
  return state ? state.label.toUpperCase() : '';
}

export function getStateCapital(uf: string): string {
  const state = BRAZILIAN_STATES.find(s => s.value === uf);
  return state ? `${state.capital.toUpperCase()}, ${uf}` : '';
}

// Gerador de RG por estado
const RG_PATTERNS: Record<string, { digits: number; suffix: string }> = {
  AC: { digits: 7, suffix: "SSP AC" }, AL: { digits: 7, suffix: "SSP AL" },
  AP: { digits: 7, suffix: "SSP AP" }, AM: { digits: 7, suffix: "SSP AM" },
  BA: { digits: 8, suffix: "SSP BA" }, CE: { digits: 8, suffix: "SSP CE" },
  DF: { digits: 7, suffix: "SSP DF" }, ES: { digits: 7, suffix: "SSP ES" },
  GO: { digits: 7, suffix: "SSP GO" }, MA: { digits: 8, suffix: "SSP MA" },
  MT: { digits: 8, suffix: "SSP MT" }, MS: { digits: 8, suffix: "SSP MS" },
  MG: { digits: 8, suffix: "SSP MG" }, PA: { digits: 7, suffix: "SSP PA" },
  PB: { digits: 7, suffix: "SSP PB" }, PR: { digits: 8, suffix: "SSP PR" },
  PE: { digits: 7, suffix: "SSP PE" }, PI: { digits: 7, suffix: "SSP PI" },
  RJ: { digits: 8, suffix: "DETRAN/RJ" }, RN: { digits: 7, suffix: "SSP RN" },
  RS: { digits: 10, suffix: "SSP RS" }, RO: { digits: 7, suffix: "SSP RO" },
  RR: { digits: 7, suffix: "SSP RR" }, SC: { digits: 7, suffix: "SSP SC" },
  SP: { digits: 8, suffix: "SSP SP" }, SE: { digits: 7, suffix: "SSP SE" },
  TO: { digits: 7, suffix: "SSP TO" },
};

export function generateRGByState(uf: string): string {
  const pattern = RG_PATTERNS[uf];
  if (!pattern) return '';
  return `${randomDigits(pattern.digits)} ${pattern.suffix}`;
}

// Formatadores
export function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatDate(value: string): string {
  let v = value.replace(/\D/g, '');
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
  if (v.length >= 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
  return v;
}
