const fs = require("fs");
const path = require("path");

let isGenerating = false;

function sincronizarModulosJson(rootDir = path.resolve(__dirname, "..")) {
  const painelDir = path.join(rootDir, "painel");
  const modulosPath = path.join(rootDir, "modulos.json");
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
          conteudo.forEach((item, idx) => {
            if (!item.id) item.id = `${nomePasta}-${arq.replace(".json", "")}-${idx}`;
            estrutura[nomePasta].registros.push(item);
          });
        } else if (typeof conteudo === "object" && conteudo !== null) {
          conteudo.id = conteudo.id || `${nomePasta}-${arq.replace(".json", "")}`;
          estrutura[nomePasta].registros.push(conteudo);
        }
      } catch (_) {}
    });
  });

  fs.writeFileSync(modulosPath, JSON.stringify(estrutura, null, 2), { encoding: "utf-8", flag: "w" });
}

function gerarProjetoCompleto(rootDir = path.resolve(__dirname, "..")) {
  if (isGenerating) return;
  isGenerating = true;

  try {
    const extensoesValidas = [".js", ".html", ".css", ".json"];
    const destino = path.join(rootDir, "projeto_completo.txt");
    let output = "";

    function varrerDiretorio(dir) {
      const itens = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of itens) {
        const nome = item.name.toLowerCase();

        // Ignora estritamente pastas pesadas e qualquer variante do arquivo de snapshot
        if (
          nome === ".git" || 
          nome === "node_modules" || 
          nome.startsWith("projeto_completo") || 
          nome === "package-lock.json"
        ) {
          continue;
        }

        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          varrerDiretorio(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (extensoesValidas.includes(ext)) {
            const relPath = "\\" + path.relative(rootDir, fullPath);
            const content = fs.readFileSync(fullPath, "utf-8");
            output += `=== ARQUIVO: ${relPath} ===\n${content}\n\n`;
          }
        }
      }
    }

    varrerDiretorio(rootDir);

    // Limpa o arquivo primeiro e grava com flag 'w' explícita
    fs.writeFileSync(destino, output, { encoding: "utf-8", flag: "w" });
    console.log(`📝 [Builder] projeto_completo.txt regerado do ZERO com sucesso.`);
  } catch (err) {
    console.error("❌ [Builder] Erro ao gerar projeto_completo.txt:", err.message);
  } finally {
    isGenerating = false;
  }
}

if (require.main === module) {
  const root = path.resolve(__dirname, "..");
  sincronizarModulosJson(root);
  gerarProjetoCompleto(root);
}

module.exports = {
  sincronizarModulosJson,
  gerarProjetoCompleto
};