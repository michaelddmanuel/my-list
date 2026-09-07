import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8790;
const MIME = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".mjs":"text/javascript",
  ".json":"application/json", ".webmanifest":"application/manifest+json",
  ".svg":"image/svg+xml", ".png":"image/png", ".ico":"image/x-icon", ".css":"text/css"
};

http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const file = normalize(join(__dirname, p));
    if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end("forbidden"); }
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end("not found");
  }
}).listen(PORT, "0.0.0.0", () => console.log("My List on http://localhost:" + PORT + "/"));
