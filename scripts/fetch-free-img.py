#!/usr/bin/env python3
"""Busca imagem de banco GRATUITO para capa de post do blog e salva otimizada
em public/blog-imgs/<slug>.jpg (1200px, JPG q82).

Fonte preferida: Pexels (defina PEXELS_API_KEY no ambiente ou em .env.local).
Fallback keyless: Openverse (licenca livre; qualidade menor).

Uso:
  python scripts/fetch-free-img.py <slug> "termo de busca em ingles"
Ex.:
  python scripts/fetch-free-img.py fluxo-de-caixa-como-controlar "cash flow small business desk"
"""
import sys, os, io, json, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "blog-imgs")
UA = "NautaBlog/1.0 (+https://nautacontabilidade.com.br)"


def load_pexels_key():
    if os.environ.get("PEXELS_API_KEY"):
        return os.environ["PEXELS_API_KEY"].strip()
    envp = os.path.join(ROOT, ".env.local")
    if os.path.exists(envp):
        for line in open(envp, encoding="utf-8"):
            m = line.strip()
            if m.startswith("PEXELS_API_KEY"):
                return m.split("=", 1)[1].strip().strip('"\'')
    return None


def http_json(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers=headers or {"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def http_bytes(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def from_pexels(query, key):
    url = ("https://api.pexels.com/v1/search?query=" + urllib.parse.quote(query)
           + "&orientation=landscape&size=large&per_page=15")
    d = http_json(url, headers={"Authorization": key, "User-Agent": UA})
    photos = d.get("photos", [])
    if not photos:
        return None
    # pega o primeiro com boa proporcao landscape
    p = photos[0]
    src = p.get("src", {})
    return src.get("landscape") or src.get("large2x") or src.get("large") or src.get("original")


def from_openverse(query):
    url = ("https://api.openverse.org/v1/images/?q=" + urllib.parse.quote(query)
           + "&license_type=commercial&aspect_ratio=wide&size=large&page_size=20&mature=false")
    d = http_json(url, headers={"User-Agent": UA})
    results = d.get("results", [])
    # prioriza fontes com fotos de gente/negocio (flickr/rawpixel) e evita wikimedia (predios/arquivo)
    def score(it):
        s = 0
        src = (it.get("source") or "").lower()
        if src in ("flickr", "rawpixel"):
            s += 3
        if "wikimedia" in src or "wikimedia" in (it.get("url") or ""):
            s -= 3
        return s
    for it in sorted(results, key=score, reverse=True):
        u = it.get("url")
        if u:
            return u
    return None


def optimize_and_save(raw, slug):
    from PIL import Image
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = im.size
    if w > 1200:
        im = im.resize((1200, int(h * 1200 / w)), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, slug + ".jpg")
    im.save(dst, "JPEG", quality=82, optimize=True)
    return dst, os.path.getsize(dst)


def main():
    if len(sys.argv) < 3:
        print("uso: python scripts/fetch-free-img.py <slug> \"query em ingles\"")
        sys.exit(1)
    slug, query = sys.argv[1], sys.argv[2]
    key = load_pexels_key()
    img_url, fonte = None, None
    if key:
        try:
            img_url = from_pexels(query, key)
            fonte = "pexels"
        except Exception as e:
            print(f"  (pexels falhou: {e}; tentando openverse)")
    if not img_url:
        img_url = from_openverse(query)
        fonte = "openverse"
    if not img_url:
        print(f"  SEM RESULTADO para '{query}' ({slug})")
        sys.exit(2)
    raw = http_bytes(img_url)
    dst, size = optimize_and_save(raw, slug)
    print(f"  {slug}.jpg  [{fonte}]  {size // 1024} KB  <- {img_url[:70]}")


if __name__ == "__main__":
    main()
