const http = require("http");
const fs = require("fs");
const path = require("path");
const { adicionarCliente, removerCliente, SCRIPT_LIVE_RELOAD } = require("./livereload");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function criarServidorHttp({ rootDir, port }) {
  return http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Private-Network", "true");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const urlPath = req.url.split("?")[0];

    // Endpoint de Live Reload
    if (urlPath === "/livereload") {
      adicionarCliente(res);
      req.on("close", () => removerCliente(res));
      return;
    }

    let cleanPath = urlPath.replace(/^\/solaria-companion/, "");
    if (!cleanPath || cleanPath === "/") cleanPath = "/index.html";

    // Manifesto com sufixo (DEV Local)
    if (cleanPath === "/manifest.json") {
      const manifestPath = path.join(rootDir, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
          manifest.name = `${manifest.name || "Solaria"} (DEV Local)`;
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          return res.end(JSON.stringify(manifest, null, 2));
        } catch (_) {}
      }
    }

    const filePath = path.join(rootDir, cleanPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || "text/plain; charset=utf-8";

      if (ext === ".html") {
        let html = fs.readFileSync(filePath, "utf-8");
        if (html.includes("</body>")) {
          html = html.replace("</body>", SCRIPT_LIVE_RELOAD);
        } else {
          html += SCRIPT_LIVE_RELOAD;
        }
        res.writeHead(200, { "Content-Type": contentType });
        return res.end(html);
      }

      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
    }
  });
}

module.exports = { criarServidorHttp };