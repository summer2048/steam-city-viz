# Serve site/ locally with correct MIME types.
# Plain `python -m http.server` on Windows takes MIME types from the registry, where .js is often mapped to
# text/plain; browsers then refuse to load the module scripts. This pins the types the site needs.
# Usage: python scripts/serve.py [port]
import functools, http.server, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
        '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml',
        '.webp': 'image/webp', '.wasm': 'application/wasm', '.bin': 'application/octet-stream',
    }

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return self.extensions_map.get(ext) or super().guess_type(path)

print(f'Serving site/ at http://localhost:{PORT}  (Ctrl+C to stop)')
http.server.ThreadingHTTPServer(('', PORT), functools.partial(Handler, directory=ROOT)).serve_forever()
