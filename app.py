# app.py
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, make_response, abort
import os

ROOT = Path(__file__).parent.resolve()
IMAGES_DIR = ROOT / "images"
ALLOWED = {".webp", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".avif"}

app = Flask(__name__, static_folder=None)


@app.route("/")
@app.route("/index.html")
def index():
    return send_from_directory(ROOT, "index.html")


@app.route("/images/<path:filename>")
def images(filename):
    # FIX: enforce ALLOWED extension — previously any file in the images dir
    # could be fetched directly (e.g. .txt, .sh) regardless of the ALLOWED set.
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED:
        abort(403)
    return send_from_directory(IMAGES_DIR, filename)


@app.route("/favicon.ico")
def favicon():
    return ("", 204)


def _scan_images():
    """Return list of {path, size, mtime} dicts for every allowed image file."""
    if not IMAGES_DIR.exists():
        return []
    out = []
    for p in sorted(IMAGES_DIR.iterdir()):
        if p.is_file() and p.suffix.lower() in ALLOWED:
            st = p.stat()
            out.append({
                "path": f"images/{p.name}",
                "size": st.st_size,
                "mtime": int(st.st_mtime),
            })
    return out


@app.route("/api/images")
def list_images():
    """Return every allowed image file in /images with size+mtime for cache-busting."""
    items = _scan_images()
    resp = make_response(jsonify(items))
    resp.headers["Cache-Control"] = "no-store, must-revalidate"
    return resp


if __name__ == "__main__":
    # FIX: debug mode via env var so it is not accidentally left on.
    # Set FLASK_DEBUG=1 in your shell to enable debug/reloader.
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"

    # FIX: guard startup check with `not debug or os.environ.get('WERKZEUG_RUN_MAIN')`
    # so the directory check only prints once even when the reloader is active.
    if not debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        if not IMAGES_DIR.exists():
            print(f"🚨  Images directory '{IMAGES_DIR}' not found — creating it.")
            print("Place your .webp / .jpg / .png files inside and restart.")
            IMAGES_DIR.mkdir(exist_ok=True)
        else:
            count = sum(1 for p in IMAGES_DIR.iterdir() if p.suffix.lower() in ALLOWED)
            print(f"✅  Images directory ready — {count} image(s) found.")

    app.run(host="127.0.0.1", port=8888, debug=debug)
