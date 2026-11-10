const fs = require("fs");
const path = require("path");

/**
 * Escaneia a pasta /painel e compila o modulos.json na raiz
 * @param {string} rootDir - Diretório raiz do projeto
 */
function sincronizarModulosJson(rootDir = path.resolve(__dirname, "..")) {
  const painelDir = path.join(rootDir, "painel");
  const modulosPath = path.join(rootDir, "modulos.json");
  const estrutura = {};
  const resumo = {};

  if (!fs.existsSync(painelDir)) {
    console.warn("⚠️ [Builder] Pasta /painel não encontrada para gerar modulos.json.");
    return;
  }

  const itens = fs.readdirSync(painelDir, { withFileTypes: true });

  itens.filter(i => i.isDirectory()).forEach(pasta => {
    const nomePasta = pasta.name;
    const caminhoPasta = path.join(painelDir, nomePasta);
    const arquivos = fs.readdirSync(caminhoPasta);

    estrutura[nomePasta] = {
      temCustomJS: arquivos.includes("module.js"),
      registros: []
    };

    // Lê todos os arquivos .json presentes na pasta do módulo (ex: painel/fichas/guarda.json)
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
      } catch (err) {
        console.error(`❌ [Builder] Erro ao ler JSON ${nomePasta}/${arq}:`, err.message);
      }
    });

    resumo[nomePasta] = estrutura[nomePasta].registros.length;
  });

  fs.writeFileSync(modulosPath, JSON.stringify(estrutura, null, 2), "utf-8");

  const detalhes = Object.entries(resumo).map(([k, v]) => `${k}: ${v}`).join(", ");
  console.log(`📁 [Builder] modulos.json sincronizado com sucesso! (${detalhes})`);
}

/**
 * Gera o snapshot consolidado de código do projeto
 */
function gerarProjetoCompleto(rootDir = path.resolve(__dirname, "..")) {
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

// Permite execução direta no terminal: node server/builder.js
if (require.main === module) {
  const root = path.resolve(__dirname, "..");
  sincronizarModulosJson(root);
  gerarProjetoCompleto(root);
}

module.exports = {
  sincronizarModulosJson,
  gerarProjetoCompleto
};