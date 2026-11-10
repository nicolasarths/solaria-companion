import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { WindowManager } from "./windows.js";
import { 
  sincronizarTodosHuds, 
  METADATA_HUD_KEY, 
  METADATA_BTN_FICHA_KEY 
} from "../painel/fichas/token-hud.js";
import { resolverRota } from "./config.js";

async function inicializarHudsAoCarregarCena() {
  try {
    const role = await OBR.player.getRole();
    if (role !== "GM") return;

    const res = await fetch(resolverRota("/modulos.json"));
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

export function iniciarEventosDoMapa() {
  // Inicialização de HUDs ao preparar a cena
  OBR.scene.isReady().then((ready) => {
    if (ready) inicializarHudsAoCarregarCena();
  });

  OBR.scene.onReadyChange((ready) => {
    if (ready) inicializarHudsAoCarregarCena();
  });

  // Escuta de clique em itens/tokens no mapa
  OBR.player.onChange(async (player) => {
    const selection = player.selection;
    if (!selection || selection.length !== 1) return;

    try {
      const items = await OBR.scene.items.getItems(selection);
      const item = items[0];
      if (!item) return;

      // 1. Clique no botão de pergaminho (Abrir/Focar Ficha)
      if (item.metadata?.[METADATA_BTN_FICHA_KEY]) {
        await OBR.player.deselect();
        await WindowManager.abrirOuFocarPainel();
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

      // 2. Clique nos badges orbitais de stats (Abrir mini-editor Quick Stat)
      if (item.metadata?.[METADATA_HUD_KEY]) {
        await OBR.player.deselect();
        const { sheetId, statId, statLabel, statCor } = item.metadata;

        await WindowManager.abrirQuickStat({
          sheetId,
          statId,
          statLabel,
          statCor,
          anchorElementId: item.id
        });
      }
    } catch (_) {}
  });
}