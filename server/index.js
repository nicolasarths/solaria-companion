const path = require("path");
const { criarServidorHttp } = require("./http");
const { sincronizarModulosJson, gerarProjetoCompleto } = require("./builder");
const { iniciarWatcher } = require("./watcher");
const { iniciarCLI } = require("./deploy");

const PORT = 8081;
const ROOT_DIR = path.resolve(__dirname, "..");

// 1. Gera arquivos essenciais na inicialização
sincronizarModulosJson(ROOT_DIR);
gerarProjetoCompleto(ROOT_DIR);

// 2. Inicia o monitor de alterações
iniciarWatcher(ROOT_DIR);

// 3. Sobe o servidor HTTP
const server = criarServidorHttp({ rootDir: ROOT_DIR, port: PORT });

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`⚡ Solaria Dev Server rodando em: http://localhost:${PORT}`);
  console.log(`📦 Manifesto Local: http://localhost:${PORT}/manifest.json`);
  console.log(`📝 projeto_completo.txt sincronizado automaticamente.`);
  console.log(`--------------------------------------------------`);
  console.log(`💬 COMANDO DE DEPLOY ATIVO:`);
  console.log(`   Digite sua mensagem no terminal e dê ENTER para`);
  console.log(`   gerar versão, commit e git push automaticamente!`);
  console.log(`==================================================\n`);

  // 4. Inicia leitura interativa do terminal
  iniciarCLI(ROOT_DIR);
});