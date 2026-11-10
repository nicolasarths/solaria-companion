const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");
const { sincronizarModulosJson, gerarProjetoCompleto } = require("./builder");

function publicarAtualizacao(mensagemCommit, rootDir) {
  const agora = new Date();
  const timestampVersao = `${agora.getFullYear()}.${agora.getMonth() + 1}.${agora.getDate()}-${agora.getHours()}${agora.getMinutes()}`;

  console.log(`\n📦 [Deploy Solaria] Iniciando publicação: "${mensagemCommit}"`);
  console.log(`🏷️ Nova versão gerada: v${timestampVersao}`);

  // 1. Injeta a versão no index.html (anti-cache)
  const indexPath = path.join(rootDir, "index.html");
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, "utf-8");
    indexHtml = indexHtml.replace(/main\.js(\?v=[^"'\s>]+)?/g, `main.js?v=${timestampVersao}`);
    fs.writeFileSync(indexPath, indexHtml, "utf-8");
    console.log(`✅ index.html atualizado com ?v=${timestampVersao}`);
  }

  // 2. Atualiza manifest.json
  const manifestPath = path.join(rootDir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      manifest.version = timestampVersao;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
      console.log(`✅ manifest.json versionado para ${timestampVersao}`);
    } catch (_) {}
  }

  // 3. Atualiza arquivos gerados
  sincronizarModulosJson(rootDir);
  gerarProjetoCompleto(rootDir);

  // 4. Git Add, Commit e Push
  try {
    console.log(`⏳ Executando git add . ...`);
    execSync("git add .", { stdio: "inherit", cwd: rootDir });

    console.log(`⏳ Executando git commit ...`);
    const commitMsgFormatada = `v${timestampVersao}: ${mensagemCommit}`;
    execSync(`git commit -m "${commitMsgFormatada.replace(/"/g, '\\"')}"`, { stdio: "inherit", cwd: rootDir });

    console.log(`🚀 Executando git push origin main ...`);
    execSync("git push", { stdio: "inherit", cwd: rootDir });

    console.log(`\n🎉 [DEPLOY CONCLUÍDO COM SUCESSO!]`);
    console.log(`👉 A versão v${timestampVersao} estará disponível no GitHub Pages em instantes.\n`);
  } catch (err) {
    console.error(`\n❌ Falha durante o deploy do Git:`, err.message);
  }
}

function iniciarCLI(rootDir) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on("line", (linha) => {
    const msg = linha.trim();
    if (!msg) return;

    if (msg.toLowerCase() === "cls" || msg.toLowerCase() === "clear") {
      console.clear();
      return;
    }

    publicarAtualizacao(msg, rootDir);
  });
}

module.exports = { iniciarCLI };