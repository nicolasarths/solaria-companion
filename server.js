const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8081;

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

let sseClients = [];

function notificarRecarregamento() {
  sseClients.forEach((client) => client.write("data: reload\n\n"));
}

const SCRIPT_LIVE_RELOAD = `
<script>
  (function() {
    const sse = new EventSource('/livereload');
    sse.onmessage = () => {
      console.log('⚡ [Solaria Dev] Atualização salva. Recarregando...');
      location.reload();
    };
  })();
</script>
</body>`;

function sincronizarModulosJson() {
  const painelDir = path.join(__dirname, "painel");
  const modulosPath = path.join(__dirname, "modulos.json");
  const estrutura = {};

  if (!fs.existsSync(painelDir)) return;

  const itens = fs.readdirSync(painelDir, { withFileTypes: true });
  itens.filter(i => i.isDirectory()).forEach(pasta => {
    const nomePasta = pasta.name;
    const caminhoPasta = path.join(painelDir, nomePasta);
    const arquivos = fs.readdirSync(caminhoPasta);

    estrutura[nomePasta] = {
      temCustomJS: arquivos.includes("module.js"),
      registros: []
    };

    arquivos.filter(f => f.endsWith(".json")).forEach(arq => {
      try {
        const conteudo = JSON.parse(fs.readFileSync(path.join(caminhoPasta, arq), "utf-8"));
        if (Array.isArray(conteudo)) {
          estrutura[nomePasta].registros.push(...conteudo);
        } else {
          conteudo.id = conteudo.id || `${nomePasta}-${arq.replace(".json", "")}`;
          estrutura[nomePasta].registros.push(conteudo);
        }
      } catch (_) {}
    });
  });

  fs.writeFileSync(modulosPath, JSON.stringify(estrutura, null, 2), "utf-8");
}

// 📦 GERAÇÃO AUTOMÁTICA DO PROJETO COMPLETO NO CTRL+S
function gerarProjetoCompleto() {
  try {
    const extensoesValidas = [".js", ".html", ".css", ".json"];
    let output = "";

    function varrerDiretorio(dir) {
      const itens = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of itens) {
        const nome = item.name;
        if (nome === ".git" || nome === "node_modules" || nome === "projeto_completo.txt" || nome === "package-lock.json") {
          continue;
        }
        const fullPath = path.join(dir, nome);
        if (item.isDirectory()) {
          varrerDiretorio(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(nome).toLowerCase();
          if (extensoesValidas.includes(ext)) {
            const relPath = "\\" + path.relative(__dirname, fullPath);
            const content = fs.readFileSync(fullPath, "utf-8");
            output += `=== ARQUIVO: ${relPath} ===\n${content}\n\n`;
          }
        }
      }
    }

    varrerDiretorio(__dirname);
    fs.writeFileSync(path.join(__dirname, "projeto_completo.txt"), output, "utf-8");
  } catch (err) {
    console.error("Erro ao gerar projeto_completo.txt:", err.message);
  }
}

let watchTimeout = null;
fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  if (
    filename.includes(".git") || 
    filename === "modulos.json" || 
    filename === "projeto_completo.txt"
  ) return;

  clearTimeout(watchTimeout);
  watchTimeout = setTimeout(() => {
    if (filename.startsWith("painel")) {
      sincronizarModulosJson();
    }
    gerarProjetoCompleto();
    notificarRecarregamento();
  }, 120);
});

sincronizarModulosJson();
gerarProjetoCompleto();

http.createServer((req, res) => {
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

  if (urlPath === "/livereload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Connection": "keep-alive"
    });
    sseClients.push(res);
    req.on("close", () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
    return;
  }

  let cleanPath = urlPath.replace(/^\/solaria-companion/, "");
  if (!cleanPath || cleanPath === "/") cleanPath = "/index.html";

  if (cleanPath === "/manifest.json") {
    const manifestPath = path.join(__dirname, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        manifest.name = `${manifest.name || "Solaria"} (DEV Local)`;
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify(manifest, null, 2));
      } catch (_) {}
    }
  }

  const filePath = path.join(__dirname, cleanPath);

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
}).listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`⚡ Solaria Dev Server rodando em: http://localhost:${PORT}`);
  console.log(`📦 Manifesto Local: http://localhost:${PORT}/manifest.json`);
  console.log(`📝 projeto_completo.txt sendo atualizado automaticamente no Ctrl+S.`);
  console.log(`==================================================\n`);
});