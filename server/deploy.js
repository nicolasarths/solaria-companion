const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");
const { sincronizarModulosJson, gerarProjetoCompleto } = require("./builder");

const GITHUB_PAGES_MANIFEST = "https://nicolasarths.github.io/solaria-companion/manifest.json";

/**
 * Consulta periodicamente o GitHub Pages até a versão alvo estar disponível
 */
async function aguardarDeployGitHubPages(versaoAlvo) {
  console.log(`\n==================================================`);
  console.log(`📡 [Monitor Pages] Acompanhando build no GitHub...`);
  console.log(`🎯 Aguardando versão remota: v${versaoAlvo}`);
  console.log(`==================================================\n`);

  const intervaloMs = 5000;
  const maxTentativas = 48; // Limite de 4 minutos
  let tentativas = 0;
  const inicio = Date.now();

  const timer = setInterval(async () => {
    tentativas++;
    const decorridoSegundos = Math.round((Date.now() - inicio) / 1000);

    try {
      // Força bypass de cache no CDN do GitHub Pages com timestamp dinâmico
      const url = `${GITHUB_PAGES_MANIFEST}?_nocache=${Date.now()}`;
      const res = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        
        if (json.version === versaoAlvo) {
          clearInterval(timer);
          try { process.stdout.write("\x07"); } catch (_) {} // Beep sonoro no terminal
          console.log(`\n==================================================`);
          console.log(`🎉 [GITHUB PAGES NO AR!] (levou ${decorridoSegundos}s)`);
          console.log(`🚀 A versão v${versaoAlvo} já está ativa para todos os jogadores!`);
          console.log(`==================================================\n`);
          return;
        }
      }
    } catch (_) {}

    console.log(`⏳ [${decorridoSegundos}s] GitHub Actions a compilar...`);

    if (tentativas >= maxTentativas) {
      clearInterval(timer);
      console.log(`\n⚠️ Tempo limite de monitorização excedido (4 min).`);
      console.log(`Verifique o pipeline em: https://github.com/nicolasarths/solaria-companion/actions\n`);
    }
  }, intervaloMs);
}

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

  // 3. Atualiza ficheiros gerados
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

    console.log(`✅ Push enviado com sucesso ao GitHub.`);

    // 5. Inicia o monitor em segundo plano
    aguardarDeployGitHubPages(timestampVersao);

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