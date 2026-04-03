export interface PdfTextField {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  pageIndex: number;
  originalText: string;
  visible: boolean;
  inputName?: string;
}

export interface PdfPageData {
  pageIndex: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement | null;
}
