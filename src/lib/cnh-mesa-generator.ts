// Gerador de CNH na Mesa (Canvas client-side)
import cnhMesaBase from '@/assets/templates/cnh-mesa-base.png';

export interface CnhMesaData {
  nome?: string;
  hab?: string;
  dataNascimento?: string;
  localNascimento?: string;
  ufNascimento?: string;
  dataEmissao?: string;
  dataValidade?: string;
  acc?: string;
  docIdentidade?: string;
  orgaoEmissor?: string;
  cpf?: string;
  numeroRegistro?: string;
  categoria?: string;
  nacionalidade?: string;
  pai?: string;
  mae?: string;
}

// Base dimensions of the CNH na Mesa template
const BASE_W = 1011;
const BASE_H = 1400;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateCnhMesa(
  canvas: HTMLCanvasElement,
  data: CnhMesaData,
  scale: number = 1
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  const s = scale;

  canvas.width = BASE_W * s;
  canvas.height = BASE_H * s;

  // Draw base template
  try {
    const baseImg = await loadImage(cnhMesaBase);
    ctx.drawImage(baseImg, 0, 0, BASE_W * s, BASE_H * s);
  } catch {
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, BASE_W * s, BASE_H * s);
  }

  // Setup text styles
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left';

  const font = (size: number) => `${size * s}px Arial, sans-serif`;

  // ===== DADOS PESSOAIS =====

  // 2 e 1 - NOME E SOBRENOME (Photoshop: X=674 Y=553, 40px → canvas scaled)
  if (data.nome) {
    ctx.font = font(27);
    ctx.fillText(data.nome.toUpperCase(), 456 * s, 470 * s);
  }

  // 1ª HABILITAÇÃO
  if (data.hab) {
    ctx.font = font(14);
    ctx.fillText(data.hab, 870 * s, 340 * s);
  }

  // 3 - DATA, LOCAL E UF DE NASCIMENTO
  if (data.dataNascimento || data.localNascimento || data.ufNascimento) {
    ctx.font = font(14);
    const nascText = [data.dataNascimento, data.localNascimento, data.ufNascimento].filter(Boolean).join(' - ');
    ctx.fillText(nascText, 415 * s, 385 * s);
  }

  // 4a - DATA EMISSÃO
  if (data.dataEmissao) {
    ctx.font = font(14);
    ctx.fillText(data.dataEmissao, 350 * s, 430 * s);
  }

  // 4b - VALIDADE
  if (data.dataValidade) {
    ctx.font = font(14);
    ctx.fillText(data.dataValidade, 600 * s, 430 * s);
  }

  // ACC
  if (data.acc) {
    ctx.font = font(20);
    ctx.fillText(data.acc, 830 * s, 432 * s);
  }

  // 4c - DOC. IDENTIDADE / ÓRG. EMISSOR / UF
  if (data.docIdentidade) {
    ctx.font = font(14);
    ctx.fillText(data.docIdentidade, 350 * s, 475 * s);
  }

  // 4d - CPF
  if (data.cpf) {
    ctx.font = font(14);
    ctx.fillText(data.cpf, 280 * s, 520 * s);
  }

  // 5 - Nº REGISTRO
  if (data.numeroRegistro) {
    ctx.font = font(14);
    ctx.fillText(data.numeroRegistro, 530 * s, 520 * s);
  }

  // 9 - CAT. HAB.
  if (data.categoria) {
    ctx.font = font(16);
    ctx.fillText(data.categoria, 830 * s, 520 * s);
  }

  // NACIONALIDADE
  if (data.nacionalidade) {
    ctx.font = font(14);
    ctx.fillText(data.nacionalidade, 350 * s, 558 * s);
  }

  // FILIAÇÃO (pai e mãe)
  if (data.pai) {
    ctx.font = font(13);
    ctx.fillText(data.pai.toUpperCase(), 280 * s, 598 * s);
  }
  if (data.mae) {
    ctx.font = font(13);
    ctx.fillText(data.mae.toUpperCase(), 280 * s, 618 * s);
  }
}

export { BASE_W, BASE_H };
