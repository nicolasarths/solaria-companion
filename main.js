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
} from "./hud/token-hud.js";
import { executarLimpezaCacheLocal, executarResetSala } from "./core/admin.js";

export const abrirOuFocarPainel = () => WindowManager.abrirOuFocarPainel();
export const togglePainelCombate = () => WindowManager.toggleCombate();

function configurarControlesUI() {
  const cacheStatus = document.getElementById("cache-status");

  document.getElementById("toggle-painel")?.addEventListener("click", () => {
    WindowManager.togglePainel();
  });

  document.getElementById("btn-combate")?.addEventListener("click", () => {
    WindowManager.toggleCombate();
  });

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

  document.getElementById("btn-limpar-cache")?.addEventListener("click", () => {
    executarLimpezaCacheLocal(cacheStatus);
  });

  document.getElementById("btn-limpar-sala")?.addEventListener("click", async () => {
    await executarResetSala(cacheStatus);
  });

  if (localStorage.getItem("solaria_auto_abrir") === "true") {
    setTimeout(() => WindowManager.abrirOuFocarPainel(), 500);
  }
}

OBR.onReady(async () => {
  await iniciarSincronizacaoBackground();
  iniciarEventosDoMapa();
  await registrarMenusContexto({
    abrirOuFocarPainel: () => WindowManager.abrirOuFocarPainel()
  });
  configurarInterfaceNuvem();
  configurarControlesUI();
});