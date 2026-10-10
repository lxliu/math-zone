#!/usr/bin/env python3
"""工具：图标生成辅助服务器 —— 静态托管仓库 + 接收 POST 落盘。

用法：
  python3 tools/icon-gen-server.py 4174 24
  然后用浏览器（或 headless Chrome）打开 http://127.0.0.1:4174/tools/icon-gen.html?size=256&format=webp
说明：无头生成时不要用 --virtual-time-budget（会在 fetch 中卡住），
      后台启动浏览器、轮询文件数、完成后 kill 即可。
"""
import http.server, socketserver, os, sys, urllib.parse, threading, time

ROOT = "/Users/liuxiao/workspace/pi/kids-playground"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4174
EXPECT = int(sys.argv[2]) if len(sys.argv) > 2 else 0
received = []
lock = threading.Lock()
start = time.time()


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        pass

    def do_POST(self):
        q = urllib.parse.urlparse(self.path)
        if q.path != "/save":
            self.send_error(404)
            return
        params = urllib.parse.parse_qs(q.query)
        rel = params.get("path", [""])[0]
        rel = rel.lstrip("/")
        if ".." in rel or not rel.startswith("assets/"):
            self.send_error(400, "bad path")
            return
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n)
        dest = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(body)
        with lock:
            received.append((rel, len(body)))
            print(f"  saved {rel}  {len(body)} bytes", flush=True)
            done = len(received)
        self.send_response(200)
        self.send_header("Content-Length", "2")
        self.end_headers()
        self.wfile.write(b"ok")
        if EXPECT and done >= EXPECT:
            print(f"DONE: {done} files received in {time.time()-start:.1f}s", flush=True)
            threading.Thread(target=self.server.shutdown, daemon=True).start()


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with S(("127.0.0.1", PORT), H) as httpd:
        print(f"serving {ROOT} on http://127.0.0.1:{PORT} (expect {EXPECT} uploads)", flush=True)
        httpd.serve_forever()
    print(f"server stopped, {len(received)} files", flush=True)
