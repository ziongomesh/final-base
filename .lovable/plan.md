

## Alinhamento Automatico das Matrizes 1, 2 e 3

### O que muda

Quando voce arrastar qualquer uma das 3 matrizes (Frente, Meio, Verso), o valor X (horizontal) sera sincronizado automaticamente entre as tres. Ou seja, elas sempre ficam na mesma coluna vertical, perfeitamente alinhadas — como na imagem de referencia.

O QR Code continua independente, podendo ser movido livremente.

### Como funciona

- As tres matrizes formam um "grupo" (ids: frente, meio, verso)
- Ao arrastar qualquer uma delas, o eixo X das outras duas e atualizado para o mesmo valor
- O eixo Y de cada uma continua independente (cada uma tem sua altura propria)
- Redimensionar tambem sincroniza a largura entre as tres (mesma largura)

### Detalhes tecnicos

No `handleMouseMove` do `PdfPositionTool.tsx`:

- Identificar se o item arrastado e uma matriz (id !== "qrcode")
- Se for, alem de atualizar o X/Y do item arrastado, atualizar o X das outras duas matrizes para o mesmo valor
- Na logica de resize: se for matriz, sincronizar o `width` entre as tres

Arquivo alterado: `src/pages/PdfPositionTool.tsx`

Trecho principal da mudanca no drag:
```typescript
const MATRIX_IDS = ["frente", "meio", "verso"];

// No handleMouseMove, ao arrastar:
if (MATRIX_IDS.includes(dragging)) {
  // Sincroniza X entre as 3 matrizes
  setItems(prev => prev.map(i => {
    if (i.id === dragging) return { ...i, x: Math.max(0, mmX), y: Math.max(0, mmY) };
    if (MATRIX_IDS.includes(i.id)) return { ...i, x: Math.max(0, mmX) };
    return i;
  }));
} else {
  // QR Code move livremente
  setItems(prev => prev.map(i => i.id === dragging ? { ...i, x: Math.max(0, mmX), y: Math.max(0, mmY) } : i));
}
```

Trecho para resize sincronizado:
```typescript
if (MATRIX_IDS.includes(resizing)) {
  setItems(prev => prev.map(i => {
    if (i.id === resizing) return { ...i, width: Math.max(10, newW), height: Math.max(10, newH) };
    if (MATRIX_IDS.includes(i.id)) return { ...i, width: Math.max(10, newW) };
    return i;
  }));
}
```

