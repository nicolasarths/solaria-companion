const fs = require("fs");
const { sincronizarModulosJson, gerarProjetoCompleto } = require("./builder");
const { notificarRecarregamento } = require("./livereload");

function iniciarWatcher(rootDir) {
  let watchTimeout = null;

  fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const norm = filename.replace(/\\/g, "/").toLowerCase();

    // Ignora qualquer eco gerado pelos próprios arquivos de build
    if (
      norm.includes(".git/") || 
      norm.includes("node_modules/") || 
      norm.includes("modulos.json") || 
      norm.includes("projeto_completo")
    ) {
      return;
    }

    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      if (norm.startsWith("painel/")) {
        sincronizarModulosJson(rootDir);
      }
      gerarProjetoCompleto(rootDir);
      notificarRecarregamento();
    }, 250); // 250ms garante que o Windows terminou todas as rajadas de escrita
  });
}

module.exports = { iniciarWatcher };