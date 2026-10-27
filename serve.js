/* Minimal static server for the GRAMCAST AI web demo (no dependencies).
 * Usage: node serve.js [port]   (default 8787; auto-increments when busy)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".md": "text/plain; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon",
};

function start(port) {
  http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let fp = path.normalize(path.join(root, urlPath === "/" ? "index.html" : urlPath));
    if (!fp.startsWith(root)) { res.writeHead(403); return res.end("Forbidden"); }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); return res.end("Not found: " + urlPath); }
      res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
      res.end(data);
    });
  }).on("error", err => {
    if (err.code === "EADDRINUSE" && port < port + 20) start(port + 1);
    else console.error("server error:", err.message);
  }).listen(port, "127.0.0.1", () => console.log("GRAMCAST preview at http://127.0.0.1:" + port));
}

start(Number(process.argv[2]) || 8787);
