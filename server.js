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
  ".png": "image/png"
};

http.createServer((req, res) => {
  // Libera CORS e Private Network Access (para o Brave/Owlbear não bloquearem)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const urlPath = req.url.split("?")[0];

  // ROTA AUTOMÁTICA: Lê todas as subpastas dentro de ./painel
  if (urlPath === "/api/modulos") {
    const painelDir = path.join(__dirname, "painel");
    const estrutura = {};

    if (fs.existsSync(painelDir)) {
      const itens = fs.readdirSync(painelDir, { withFileTypes: true });

      itens.filter(i => i.isDirectory()).forEach(pasta => {
        const nomePasta = pasta.name;
        const caminhoPasta = path.join(painelDir, nomePasta);
        const arquivos = fs.readdirSync(caminhoPasta);

        estrutura[nomePasta] = {
          temCustomJS: arquivos.includes("module.js"),
          registros: []
        };

        // Lê automaticamente qualquer arquivo .json solto dentro da subpasta
        arquivos.filter(f => f.endsWith(".json")).forEach(arq => {
          try {
            const conteudo = JSON.parse(fs.readFileSync(path.join(caminhoPasta, arq), "utf-8"));
            if (Array.isArray(conteudo)) {
              estrutura[nomePasta].registros.push(...conteudo);
            } else {
              conteudo.id = conteudo.id || `${nomePasta}-${arq.replace(".json", "")}`;
              estrutura[nomePasta].registros.push(conteudo);
            }
          } catch (e) {
            console.error(`Erro no JSON ${nomePasta}/${arq}:`, e.message);
          }
        });
      });
    }

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(estrutura));
  }

  // Serve os arquivos normais da extensão
  const filePath = path.join(__dirname, urlPath === "/" ? "index.html" : urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(PORT, () => {
  console.log(`Servidor modular rodando em http://localhost:${PORT}`);
});