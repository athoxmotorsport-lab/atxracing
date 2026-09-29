"""Local preview with the same /atxracing/ path as GitHub Pages."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/atxracing/'):
            self.path = self.path[len('/atxracing'):]
        return super().do_GET()

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1] / 'dist'
    ThreadingHTTPServer(('127.0.0.1', 4173), partial(Handler, directory=str(root))).serve_forever()
