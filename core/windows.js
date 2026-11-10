import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { resolverRota } from "./config.js";

export const WINDOW_IDS = {
  PAINEL: "solaria-painel-inferior-direito",
  COMBATE: "solaria-painel-combate",
  QUICK_STAT: "solaria-quick-stat-editor"
};

export const WindowManager = {
  painelAberto: false,
  combateAberto: false,

  async abrirOuFocarPainel() {
    if (!this.painelAberto) {
      const salvo = JSON.parse(localStorage.getItem("solaria_painel_dimensoes") || "{}");
      const width = salvo.width || 480;
      const height = salvo.height || 680;

      await OBR.popover.open({
        id: WINDOW_IDS.PAINEL,
        url: resolverRota("/painel/painel.html"),
        height: height,
        width: width,
        anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
        transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
        disableClickAway: true
      });
      this.painelAberto = true;
    }
  },

  async fecharPainel() {
    if (this.painelAberto) {
      await OBR.popover.close(WINDOW_IDS.PAINEL);
      this.painelAberto = false;
    }
  },

  async togglePainel() {
    if (!this.painelAberto) {
      await this.abrirOuFocarPainel();
    } else {
      await this.fecharPainel();
    }
  },

  async abrirCombate() {
    await OBR.popover.open({
      id: WINDOW_IDS.COMBATE,
      url: resolverRota("/combate/combate.html"),
      height: 400,
      width: 310,
      anchorOrigin: { horizontal: "LEFT", vertical: "BOTTOM" },
      transformOrigin: { horizontal: "LEFT", vertical: "BOTTOM" },
      disableClickAway: true
    });
    this.combateAberto = true;
  },

  async fecharCombate() {
    await OBR.popover.close(WINDOW_IDS.COMBATE);
    this.combateAberto = false;
  },

  async toggleCombate() {
    if (!this.combateAberto) {
      await this.abrirCombate();
    } else {
      await this.fecharCombate();
    }
  },

  async abrirQuickStat({ sheetId, statId, statLabel, statCor, anchorElementId }) {
    const query = new URLSearchParams({
      sheetId,
      statId,
      label: statLabel || statId.toUpperCase(),
      cor: statCor || "#7aa2f7"
    }).toString();

    await OBR.popover.open({
      id: WINDOW_IDS.QUICK_STAT,
      url: resolverRota(`/painel/fichas/quick-stat.html?${query}`),
      width: 210,
      height: 115,
      anchorElementId: anchorElementId,
      anchorOrigin: { horizontal: "CENTER", vertical: "TOP" },
      transformOrigin: { horizontal: "CENTER", vertical: "BOTTOM" }
    });
  }
};