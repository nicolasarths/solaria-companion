import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { registrarMenusContexto } from "./menu/options.js";
import { configurarInterfaceNuvem } from "./core/cloud.js";
import { WindowManager } from "./core/windows.js";
import { iniciarEventosDoMapa } from "./core/map-events.js";
import { iniciarSincronizacaoBackground } from "./core/background-sync.js";
import { 
  sincronizarTodosHuds, 
  METADATA_HUD_KEY, 
  METADATA_BTN_FICHA_KEY 
} from "./painel/fichas/token-hud.js";

// Exportações de conveniência delegadas ao WindowManager
export const abrirOuFocarPainel = () => WindowManager.abrirOuFocarPainel();
export const togglePainelCombate = () => WindowManager.toggleCombate();

/**
 * Conecta os controles visuais e de armazenamento do index.html
 */
function configurarControlesUI() {
  const cacheStatus = document.getElementById("cache-status");

  // 1. Abertura e alternância de janelas
  document.getElementById("toggle-painel")?.addEventListener("click", () => {
    WindowManager.togglePainel();
  });

  document.getElementById("btn-combate")?.addEventListener("click", () => {
    WindowManager.toggleCombate();
  });

  // 2. Opções visuais do usuário
  const toggleStats = document.getElementById("toggle-stats");
  if (toggleStats) {
    toggleStats.checked = localStorage.getItem("solaria_exibir_stats") !== "false";
    toggleStats.addEventListener("change", async (e) => {
      localStorage.setItem("solaria_exibir_stats", e.target.checked);
      const fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
      await sincronizarTodosHuds(fichas);
    });
  }

  const toggleAuto = document.getElementById("toggle-autoabrir");
  if (toggleAuto) {
    toggleAuto.checked = localStorage.getItem("solaria_auto_abrir") === "true";
    toggleAuto.addEventListener("change", (e) => {
      localStorage.setItem("solaria_auto_abrir", e.target.checked);
    });
  }

  // 3. Limpeza de cache local
  document.getElementById("btn-limpar-cache")?.addEventListener("click", () => {
    if (!window.confirm("Deseja apagar os dados locais do Solaria salvos neste navegador?")) return;

    Object.keys(localStorage)
      .filter(k => k.startsWith("solaria_"))
      .forEach(k => localStorage.removeItem(k));

    if (cacheStatus) {
      cacheStatus.textContent = "Cache local limpo! Recarregando...";
      cacheStatus.style.color = "#9ece6a";
    }
    setTimeout(() => location.reload(), 400);
  });

  // 4. Reset dos dados da sala no Owlbear (Apenas GM)
  document.getElementById("btn-limpar-sala")?.addEventListener("click", async () => {
    if (!window.confirm("Deseja apagar todas as fichas, notas e combate da SALA do Owlbear Rodeo? (Apenas Mestre)")) return;

    try {
      const role = await OBR.player.getRole();
      if (role !== "GM") {
        alert("Apenas o Mestre pode resetar os dados da sala.");
        return;
      }

      await OBR.room.setMetadata({
        "solaria/sync_fichas": [],
        "solaria/sync_notas": [],
        "solaria/sync_combate": { rodada: 1, ativoIndex: 0, participantes: [] }
      });

      const itens = await OBR.scene.items.getItems();
      const huds = itens.filter(i => 
        i.metadata?.[METADATA_HUD_KEY] || 
        i.metadata?.[METADATA_BTN_FICHA_KEY] || 
        i.id.startsWith("solaria_hud_")
      );

      if (huds.length > 0) {
        await OBR.scene.items.deleteItems(huds.map(h => h.id));
      }

      if (cacheStatus) {
        cacheStatus.textContent = "Sala e HUDs do mapa resetados!";
        cacheStatus.style.color = "#9ece6a";
      }
      try { OBR.notification.show("Dados da sala e HUDs resetados! 🧹"); } catch (_) {}
    } catch (err) {
      if (cacheStatus) {
        cacheStatus.textContent = "Erro: " + err.message;
        cacheStatus.style.color = "#f7768e";
      }
    }
  });

  // 5. Inicialização opcional configurada pelo usuário
  if (localStorage.getItem("solaria_auto_abrir") === "true") {
    setTimeout(() => WindowManager.abrirOuFocarPainel(), 500);
  }
}

OBR.onReady(async () => {
  // Inicializa subsistemas desacoplados
  await iniciarSincronizacaoBackground();
  iniciarEventosDoMapa();
  await registrarMenusContexto({
    abrirOuFocarPainel: () => WindowManager.abrirOuFocarPainel()
  });
  configurarInterfaceNuvem();

  // Liga controles da interface
  configurarControlesUI();
});