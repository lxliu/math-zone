#!/usr/bin/env python3
"""冒烟测试专用服务：托管仓库，但对 sw.js 返回 404（避免预缓存把无头截图卡死）。"""
import http.server, socketserver, sys, os

ROOT = "/Users/liuxiao/workspace/pi/kids-playground"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4175


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        if self.path.split("?")[0].rstrip("/").endswith("sw.js"):
            self.send_error(404, "sw disabled for smoke test")
            return None
        return super().send_head()


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with S(("127.0.0.1", PORT), H) as httpd:
        print(f"smoke server on http://127.0.0.1:{PORT}", flush=True)
        httpd.serve_forever()
