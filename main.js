import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { registrarMenusContexto } from "./menu/options.js";
import { sincronizarTodosHuds, METADATA_HUD_KEY, METADATA_BTN_FICHA_KEY } from "./painel/fichas/token-hud.js";

const ID_PAINEL = "solaria-painel-inferior-direito";
const ID_QUICK_STAT = "solaria-quick-stat-editor";
let aberto = false;

// 🔥 SOLUÇÃO DEFINITIVA: Força o caminho absoluto no GitHub Pages
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal ? "" : "https://nicolasarths.github.io/solaria-companion";

export async function abrirOuFocarPainel() {
  if (!aberto) {
    const salvo = JSON.parse(localStorage.getItem("solaria_painel_dimensoes") || "{}");
    const width = salvo.width || 480;
    const height = salvo.height || 680;

    await OBR.popover.open({
      id: ID_PAINEL,
      url: BASE_URL + "/painel/painel.html",
      height: height,
      width: width,
      anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      disableClickAway: true
    });
    aberto = true;
  }
}

async function inicializarHudsAoCarregarCena() {
  try {
    const res = await fetch(BASE_URL + "/modulos.json");
    const modulos = await res.json();
    let fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");

    if (modulos.fichas?.registros) {
      modulos.fichas.registros.forEach(f => {
        if (!fichas.some(item => item.id === f.id)) {
          fichas.push(f);
        }
      });
    }

    await sincronizarTodosHuds(fichas);
  } catch (err) {
    console.error("Erro ao sincronizar HUDs iniciais:", err);
  }
}

OBR.onReady(async () => {
  const btn = document.getElementById("toggle-painel");
  if (btn) {
    btn.addEventListener("click", async () => {
      if (!aberto) {
        await abrirOuFocarPainel();
      } else {
        await OBR.popover.close(ID_PAINEL);
        aberto = false;
      }
    });
  }

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

  const btnCombate = document.getElementById("btn-combate");
  if (btnCombate) {
    btnCombate.addEventListener("click", () => {
      OBR.notification.show("Módulo de combate será implementado em breve! ⚔️");
    });
  }

  const autoAbrir = localStorage.getItem("solaria_auto_abrir") === "true";
  if (autoAbrir && !aberto) {
    setTimeout(() => abrirOuFocarPainel(), 500);
  }

  await registrarMenusContexto({ abrirOuFocarPainel });

  const isReady = await OBR.scene.isReady();
  if (isReady) {
    await inicializarHudsAoCarregarCena();
  }
  OBR.scene.onReadyChange(async (ready) => {
    if (ready) {
      await inicializarHudsAoCarregarCena();
    }
  });

  OBR.player.onChange(async (player) => {
    const selection = player.selection;
    if (!selection || selection.length !== 1) return;

    try {
      const items = await OBR.scene.items.getItems(selection);
      const item = items[0];
      if (!item) return;

      if (item.metadata?.[METADATA_BTN_FICHA_KEY]) {
        await OBR.player.deselect();
        await abrirOuFocarPainel();
        const sheetId = item.metadata.sheetId;

        localStorage.setItem("solaria_acao_pendente", JSON.stringify({
          tipo: "FOCAR_FICHA",
          sheetId: sheetId,
          timestamp: Date.now()
        }));

        try {
          await OBR.broadcast.sendMessage("solaria/focar-ficha-token", { sheetId });
        } catch (_) {}
        return;
      }

      if (item.metadata?.[METADATA_HUD_KEY]) {
        await OBR.player.deselect();
        const { sheetId, statId, statLabel, statCor } = item.metadata;
        const query = new URLSearchParams({
          sheetId,
          statId,
          label: statLabel || statId.toUpperCase(),
          cor: statCor || "#7aa2f7"
        }).toString();

        await OBR.popover.open({
          id: ID_QUICK_STAT,
          url: BASE_URL + `/painel/fichas/quick-stat.html?${query}`,
          width: 210,
          height: 115,
          anchorElementId: item.id,
          anchorOrigin: { horizontal: "CENTER", vertical: "TOP" },
          transformOrigin: { horizontal: "CENTER", vertical: "BOTTOM" }
        });
      }
    } catch (_) {}
  });
});