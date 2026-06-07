#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de CRAF. Le JSON via stdin e escreve JSON em stdout.
Payload:
{
  "base_path": "...png",
  "qrcode_path": "...png" | null,
  "output_path": "...png",
  "font_path": "C:\\Windows\\Fonts\\arial.ttf",
  "campos": { "tipo","registro","n_serie","n_sigma","calibre","marca",
              "data_expedicao","gac_emissora","cidade_uf","amparo_legal",
              "sfpc_vinculacao","rg","cpf","nome","validade" }
}
"""
import sys, os, json, traceback

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception as e:
    print(json.dumps({"ok": False, "error": f"Pillow nao instalado: {e}. Rode: pip install Pillow"}))
    sys.exit(1)

# Coordenadas EXATAS do script original (sem escala).

CAMPOS_LAYOUT = [
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
QR_SIZE = 260


def load_font(font_path: str, size: int):
    for fp in [font_path, "C:\\Windows\\Fonts\\arial.ttf",
               "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "arial.ttf"]:
        if not fp:
            continue
        try:
            return ImageFont.truetype(fp, size)
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

    base_img = Image.open(base_path).convert("RGB")
    # Cria folha branca maior e cola a base no topo, garantindo espaco abaixo
    CANVAS_W = max(base_img.width, 1700)
    CANVAS_H = max(base_img.height, 2800)
    imagem = Image.new("RGB", (CANVAS_W, CANVAS_H), (255, 255, 255))
    offset_x = (CANVAS_W - base_img.width) // 2
    imagem.paste(base_img, (offset_x, 0))
    draw = ImageDraw.Draw(imagem)

    if qrcode_path and os.path.exists(qrcode_path):
        qr = Image.open(qrcode_path).convert("RGBA")
        imagem.paste(qr, QR_POS, qr)

    for key, x, y, size in CAMPOS_LAYOUT:
        valor = campos.get(key)
        if valor is None or valor == "":
            continue
        draw.text(
            (x, y),
            str(valor),
            fill=(0, 0, 0),
            font=load_font(font_path, size),
        )

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    imagem.save(output_path, "PNG")
    return output_path


def main():
    try:
        raw = sys.stdin.read()
        if not raw:
            raise ValueError("payload vazio em stdin")
        out = gerar(json.loads(raw))
        print(json.dumps({"ok": True, "output": out}))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e), "trace": traceback.format_exc()}))
        sys.exit(2)


if __name__ == "__main__":
    main()
