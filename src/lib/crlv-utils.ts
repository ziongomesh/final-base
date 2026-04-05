// Utilitários para geração de dados do CRLV 2026

function randomDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) result += Math.floor(Math.random() * 10);
  return result;
}

export function generateRenavam(): string {
  return randomDigits(11);
}

export function generatePlaca(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * 26)];
  const l2 = letters[Math.floor(Math.random() * 26)];
  const l3 = letters[Math.floor(Math.random() * 26)];
  const d1 = Math.floor(Math.random() * 10);
  const l4 = letters[Math.floor(Math.random() * 26)];
  const d2 = Math.floor(Math.random() * 10);
  const d3 = Math.floor(Math.random() * 10);
  return `${l1}${l2}${l3}${d1}${l4}${d2}${d3}`;
}

export function generateNumeroCRV(): string {
  return randomDigits(10);
}

export function generateSegurancaCRV(): string {
  return randomDigits(10);
}

export function generateCodSegCLA(): string {
  return randomDigits(11);
}

export function generateChassi(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let result = '';
  // Typical VIN: 17 chars, starts with region code
  const prefixes = ['9B', '93', '9BD', '8AF'];
  result = prefixes[Math.floor(Math.random() * prefixes.length)];
  while (result.length < 17) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result.substring(0, 17);
}

export function generateMotor(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export const CATEGORIAS_VEICULO = [
  'PARTICULAR',
  'ALUGUEL',
  'OFICIAL',
  'DIPLOMATICO',
  'APRENDIZAGEM',
  'MISSAO DIPLOMATICA',
];

export const COMBUSTIVEIS = [
  'GASOLINA',
  'ALCOOL',
  'DIESEL',
  'FLEX',
  'GNV',
  'ELETRICO',
  'HIBRIDO',
  'GASOLINA/ALCOOL',
];

export const CORES_VEICULO = [
  'BRANCA', 'PRETA', 'PRATA', 'CINZA', 'VERMELHA', 'AZUL',
  'VERDE', 'AMARELA', 'MARROM', 'BEGE', 'LARANJA', 'DOURADA',
  'FANTASIA', 'VINHO', 'ROSA',
];

export const ESPECIES_TIPO = [
  'PASSAGEIRO',
  'CARGA',
  'MISTO',
  'CARGA / CAMINHONETE',
  'ESPECIAL',
  'TRAÇÃO',
  'REBOQUE',
  'SEMI-REBOQUE',
  'UTILITÁRIO',
];

export const CARROCERIAS = [
  'SEDAN',
  'HATCH',
  'SUV',
  'PICKUP',
  'ABERTA CABINE DUPLA',
  'FECHADA BAU',
  'ABERTA',
  'CAMINHONETE',
  'FURGÃO',
  'CAMIONETA',
  'MOTOCICLETA',
  'MOTONETA',
  'QUADRICICLO',
  'TRICICLO',
  'MICRO-ONIBUS',
  'ONIBUS',
  'REBOQUE',
  'CHASSI PLATAFORMA',
  'NÃO APLICAVEL',
];

export const UFS_BRASIL = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];
