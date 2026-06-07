#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de CRAF - Certificado de Registro de Arma de Fogo.
Recebe JSON via stdin com:
{
  "base_path": "...png",
  "qrcode_path": "...png",
  "foto_path": "...png" (opcional - detalhamento),
  "output_path": "...png",
  "font_path": "C:\\Windows\\Fonts\\arial.ttf",
  "campos": {
    "tipo", "registro", "n_serie", "n_sigma", "calibre", "marca",
    "data_expedicao", "gac_emissora", "cidade_uf", "amparo_legal",
    "sfpc_vinculacao", "rg", "cpf", "nome", "validade"
  }
}
Escreve em stdout JSON {"ok": true, "output": "..."} ou {"ok": false, "error": "..."}.
"""
import sys
import os
import json
import traceback

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception as e:
    print(json.dumps({"ok": False, "error": f"Pillow nao instalado: {e}. Rode: pip install Pillow"}))
    sys.exit(1)


# Posicoes e tamanhos EXATOS do script original do usuario
CAMPOS_LAYOUT = [
    # (chave,           x,     y,    size)
    ("tipo",            1310, 2053, 18),
    ("registro",        1297, 1960, 21),
    ("n_serie",         1309, 2210, 18),
    ("n_sigma",         1545, 2210, 18),
    ("calibre",         1309, 2128, 18),
    ("marca",           1550, 2053, 18),
    ("data_expedicao",  1306, 2279, 20),
    ("gac_emissora",    1293, 2423, 18),
    ("cidade_uf",       1294, 2465, 18),
    ("amparo_legal",     711, 1465, 18),
    ("sfpc_vinculacao", 1356, 1363, 18),
    ("rg",              1018, 1363, 18),
    ("cpf",              712, 1363, 18),
    ("nome",             712, 1245, 20),
    ("validade",         706, 1136, 21),
]

QR_POS = (691, 1929)


def load_font(font_path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(font_path, size)
    except Exception:
        # Fallback: tenta arial relativa, depois default
        for fb in [
            "C:\\Windows\\Fonts\\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "arial.ttf",
        ]:
            try:
                return ImageFont.truetype(fb, size)
            except Exception:
                continue
        return ImageFont.load_default()


def gerar(opts: dict) -> str:
    base_path = opts["base_path"]
    output_path = opts["output_path"]
    qrcode_path = opts.get("qrcode_path")
    font_path = opts.get("font_path") or "C:\\Windows\\Fonts\\arial.ttf"
    campos = opts.get("campos", {})

    if not os.path.exists(base_path):
        raise FileNotFoundError(f"base nao encontrada: {base_path}")

    imagem = Image.open(base_path).convert("RGB")
    draw = ImageDraw.Draw(imagem)

    # Colar QR-Code
    if qrcode_path and os.path.exists(qrcode_path):
        qr = Image.open(qrcode_path).convert("RGBA")
        imagem.paste(qr, QR_POS, qr)

    # Desenhar campos
    for key, x, y, size in CAMPOS_LAYOUT:
        valor = campos.get(key)
        if valor is None or valor == "":
            continue
        fnt = load_font(font_path, size)
        draw.text((x, y), str(valor), fill=(0, 0, 0), font=fnt)

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    imagem.save(output_path, "PNG")
    return output_path


def main() -> None:
    try:
        raw = sys.stdin.read()
        if not raw:
            raise ValueError("payload vazio em stdin")
        opts = json.loads(raw)
        out = gerar(opts)
        print(json.dumps({"ok": True, "output": out}))
    except Exception as e:
        print(json.dumps({
            "ok": False,
            "error": str(e),
            "trace": traceback.format_exc(),
        }))
        sys.exit(2)


if __name__ == "__main__":
    main()
