const fs = require("fs");
const { sincronizarModulosJson, gerarProjetoCompleto } = require("./builder");
const { notificarRecarregamento } = require("./livereload");

function iniciarWatcher(rootDir) {
  let watchTimeout = null;

  fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    if (
      filename.includes(".git") || 
      filename.includes("node_modules") || 
      filename === "modulos.json" || 
      filename === "projeto_completo.txt"
    ) {
      return;
    }

    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      if (filename.startsWith("painel")) {
        sincronizarModulosJson(rootDir);
      }
      gerarProjetoCompleto(rootDir);
      notificarRecarregamento();
    }, 120);
  });
}

module.exports = { iniciarWatcher };