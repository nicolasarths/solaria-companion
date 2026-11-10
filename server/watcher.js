const fs = require("fs");
const { sincronizarModulosJson, gerarProjetoCompleto } = require("./builder");
const { notificarRecarregamento } = require("./livereload");

function iniciarWatcher(rootDir) {
  let watchTimeout = null;

  fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Normaliza separadores de caminho (Windows vs POSIX)
    const norm = filename.replace(/\\/g, "/");

    // Ignora alterações em diretórios internos e nos arquivos gerados pelo próprio watcher
    if (
      norm.includes(".git/") || 
      norm.includes("node_modules/") || 
      norm.endsWith("modulos.json") || 
      norm.endsWith("projeto_completo.txt")
    ) {
      return;
    }

    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      // Se qualquer arquivo dentro de painel/ for criado, editado ou excluído, recompila modulos.json
      if (norm.startsWith("painel/")) {
        sincronizarModulosJson(rootDir);
      }
      gerarProjetoCompleto(rootDir);
      notificarRecarregamento();
    }, 120);
  });
}

module.exports = { iniciarWatcher };