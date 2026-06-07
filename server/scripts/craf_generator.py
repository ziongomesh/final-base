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

# Coordenadas EXATAS do script original, calibradas na base 1700x2480.
# O template do projeto pode estar otimizado/redimensionado; por isso o backend
# precisa escalar as coordenadas antes de desenhar, mantendo a fidelidade do .py.
REF_W = 1700
REF_H = 2480

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

    imagem = Image.open(base_path).convert("RGB")
    draw = ImageDraw.Draw(imagem)
    sx = imagem.width / REF_W
    sy = imagem.height / REF_H

    if qrcode_path and os.path.exists(qrcode_path):
        qr = Image.open(qrcode_path).convert("RGBA")
        qr_size = max(1, round(QR_SIZE * sx))
        qr = qr.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        imagem.paste(qr, (round(QR_POS[0] * sx), round(QR_POS[1] * sy)), qr)

    for key, x, y, size in CAMPOS_LAYOUT:
        valor = campos.get(key)
        if valor is None or valor == "":
            continue
        draw.text(
            (round(x * sx), round(y * sy)),
            str(valor),
            fill=(0, 0, 0),
            font=load_font(font_path, max(1, round(size * sy))),
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
