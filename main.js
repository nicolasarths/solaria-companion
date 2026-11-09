import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { registrarMenusContexto } from "./menu/options.js";
import { 
  sincronizarTodosHuds, 
  atualizarHudToken, 
  removerHudToken, 
  METADATA_HUD_KEY, 
  METADATA_BTN_FICHA_KEY 
} from "./painel/fichas/token-hud.js";
import { configurarInterfaceNuvem } from "./core/cloud.js";

const ID_PAINEL = "solaria-painel-inferior-direito";
const ID_QUICK_STAT = "solaria-quick-stat-editor";
let aberto = false;

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
    const role = await OBR.player.getRole();
    if (role !== "GM") return;

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

  configurarInterfaceNuvem();

  // Limpeza de Cache Local
  const btnLimparCache = document.getElementById("btn-limpar-cache");
  const cacheStatus = document.getElementById("cache-status");
  if (btnLimparCache) {
    btnLimparCache.addEventListener("click", () => {
      const confirmou = window.confirm("Deseja apagar os dados locais do Solaria salvos neste navegador?");
      if (!confirmou) return;

      Object.keys(localStorage)
        .filter(k => k.startsWith("solaria_"))
        .forEach(k => localStorage.removeItem(k));

      if (cacheStatus) {
        cacheStatus.textContent = "Cache local limpo! Recarregando...";
        cacheStatus.style.color = "#9ece6a";
      }
      try { OBR.notification.show("Armazenamento local do Solaria zerado!"); } catch (_) {}
      setTimeout(() => location.reload(), 500);
    });
  }

  // Reset de Sala (Owlbear Room Metadata e HUDs)
  const btnLimparSala = document.getElementById("btn-limpar-sala");
  if (btnLimparSala) {
    btnLimparSala.addEventListener("click", async () => {
      const confirmou = window.confirm("Deseja apagar todas as fichas e notas da SALA do Owlbear Rodeo? (Apenas Mestre)");
      if (!confirmou) return;

      try {
        const role = await OBR.player.getRole();
        if (role !== "GM") {
          alert("Apenas o Mestre pode resetar os dados da sala.");
          return;
        }

        await OBR.room.setMetadata({
          "solaria/sync_fichas": [],
          "solaria/sync_notas": []
        });

        const itens = await OBR.scene.items.getItems();
        const huds = itens.filter(i => i.metadata?.[METADATA_HUD_KEY] || i.metadata?.[METADATA_BTN_FICHA_KEY]);
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

  // Ouvintes Globais em Segundo Plano
  OBR.broadcast.onMessage("solaria/ficha-sync", async (e) => {
    const fichaAtualizada = e.data;
    if (!fichaAtualizada || !fichaAtualizada.id) return;

    let fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    const idx = fichas.findIndex(f => f.id === fichaAtualizada.id);
    if (idx >= 0) {
      fichas[idx] = fichaAtualizada;
    } else {
      fichas.unshift(fichaAtualizada);
    }
    localStorage.setItem("solaria_fichas_custom", JSON.stringify(fichas));
    await atualizarHudToken(fichaAtualizada);
  });

  OBR.broadcast.onMessage("solaria/ficha-excluida", async (e) => {
    const idExcluir = e.data;
    if (!idExcluir) return;

    let fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    const f = fichas.find(item => item.id === idExcluir);
    if (f?.tokenId) await removerHudToken(f.tokenId, idExcluir);
    fichas = fichas.filter(item => item.id !== idExcluir);
    localStorage.setItem("solaria_fichas_custom", JSON.stringify(fichas));
  });

  OBR.broadcast.onMessage("solaria/ficha-stat-atualizado", async (e) => {
    const { sheetId } = e.data || {};
    if (!sheetId) return;
    const fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    const f = fichas.find(item => item.id === sheetId);
    if (f) await atualizarHudToken(f);
  });

  OBR.broadcast.onMessage("solaria/nota-sync", (e) => {
    const notaAtualizada = e.data;
    if (!notaAtualizada || !notaAtualizada.id) return;

    let notas = JSON.parse(localStorage.getItem("solaria_notas_multiplas") || "[]");
    const idx = notas.findIndex(n => n.id === notaAtualizada.id);
    if (idx >= 0) {
      notas[idx] = notaAtualizada;
    } else {
      notas.unshift(notaAtualizada);
    }
    localStorage.setItem("solaria_notas_multiplas", JSON.stringify(notas));
  });

  OBR.broadcast.onMessage("solaria/nota-excluida", (e) => {
    const idExcluir = e.data;
    if (!idExcluir) return;

    let notas = JSON.parse(localStorage.getItem("solaria_notas_multiplas") || "[]");
    notas = notas.filter(n => n.id !== idExcluir);
    localStorage.setItem("solaria_notas_multiplas", JSON.stringify(notas));
  });

  // Interação com Elementos e Tokens no Grid
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