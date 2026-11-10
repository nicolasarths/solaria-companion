const fs = require("fs");
const path = require("path");

function sincronizarModulosJson(rootDir) {
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

function gerarProjetoCompleto(rootDir) {
  try {
    const extensoesValidas = [".js", ".html", ".css", ".json"];
    let output = "";

    function varrerDiretorio(dir) {
      const itens = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of itens) {
        const nome = item.name;
        if (
          nome === ".git" || 
          nome === "node_modules" || 
          nome === "projeto_completo.txt" || 
          nome === "package-lock.json"
        ) {
          continue;
        }

        const fullPath = path.join(dir, nome);
        if (item.isDirectory()) {
          varrerDiretorio(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(nome).toLowerCase();
          if (extensoesValidas.includes(ext)) {
            const relPath = "\\" + path.relative(rootDir, fullPath);
            const content = fs.readFileSync(fullPath, "utf-8");
            output += `=== ARQUIVO: ${relPath} ===\n${content}\n\n`;
          }
        }
      }
    }

    varrerDiretorio(rootDir);
    fs.writeFileSync(path.join(rootDir, "projeto_completo.txt"), output, "utf-8");
  } catch (err) {
    console.error("Erro ao gerar projeto_completo.txt:", err.message);
  }
}

module.exports = {
  sincronizarModulosJson,
  gerarProjetoCompleto
};