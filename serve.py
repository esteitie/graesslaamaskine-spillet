#!/usr/bin/env python3
"""Lille statisk server, saa spillet kan koeres uden node.

    python3 serve.py [port]

Udskriver ogsaa maskinens IP-adresse, saa spillet kan aabnes paa en iPad
paa det samme wifi.
"""
import http.server
import socket
import socketserver
import sys
import os

# 8080, ikke 5000: macOS' AirPlay-modtager (Kontrolcenter) sidder paa 5000
# og svarer 403 paa alt. Ledige porte proeves i raekkefoelge.
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 0
FALLBACKS = [8080, 8000, 5173, 4321]
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
        '.svg': 'image/svg+xml',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'
    finally:
        s.close()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def start():
    ports = [PORT] if PORT else FALLBACKS
    for port in ports:
        try:
            return Server(('0.0.0.0', port), Handler), port
        except OSError as err:
            if err.errno != 48:
                raise
            print('Port %d er optaget - proever den naeste.' % port)
    raise SystemExit('Ingen ledige porte. Proev: python3 serve.py 9000')


httpd, port = start()
with httpd:
    print('Graesslaamaskine Spillet')
    print('  Denne computer : http://localhost:%d' % port)
    print('  iPad paa wifi  : http://%s:%d' % (lan_ip(), port))
    print('Stop med Ctrl+C')
    httpd.serve_forever()
