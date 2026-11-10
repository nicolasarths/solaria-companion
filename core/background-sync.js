import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { SolariaSync } from "./sync.js";
import { atualizarHudToken, removerHudToken } from "../hud/token-hud.js";
import { WindowManager } from "./windows.js";

export async function iniciarSincronizacaoBackground() {
  const currentRole = await OBR.player.getRole();

  SolariaSync.iniciarOuvinteSala({
    onFichasRecebidas: (fichasPublicas) => {
      if (currentRole !== "GM") {
        localStorage.setItem("solaria_fichas_custom", JSON.stringify(fichasPublicas));
      }
    },
    onNotasRecebidas: (notasPublicas) => {
      if (currentRole !== "GM") {
        localStorage.setItem("solaria_notas_multiplas", JSON.stringify(notasPublicas));
      }
    }
  });

  OBR.broadcast.onMessage("solaria/combate-fechado", () => {
    WindowManager.combateAberto = false;
  });

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

    if (currentRole === "GM") {
      await atualizarHudToken(fichaAtualizada);
      await SolariaSync.sincronizarFichasComSala(fichas);
    }
  });

  OBR.broadcast.onMessage("solaria/ficha-excluida", async (e) => {
    const idExcluir = e.data;
    if (!idExcluir) return;

    let fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    const f = fichas.find(item => item.id === idExcluir);
    if (f?.tokenId) await removerHudToken(f.tokenId, idExcluir);
    fichas = fichas.filter(item => item.id !== idExcluir);
    localStorage.setItem("solaria_fichas_custom", JSON.stringify(fichas));

    if (currentRole === "GM") {
      await SolariaSync.sincronizarFichasComSala(fichas);
    }
  });

  OBR.broadcast.onMessage("solaria/ficha-stat-atualizado", async (e) => {
    const { sheetId } = e.data || {};
    if (!sheetId) return;
    const fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    const f = fichas.find(item => item.id === sheetId);
    if (currentRole === "GM" && f) {
      await atualizarHudToken(f);
      await SolariaSync.sincronizarFichasComSala(fichas);
    }
  });

  OBR.broadcast.onMessage("solaria/nota-sync", async (e) => {
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

    if (currentRole === "GM") {
      await SolariaSync.sincronizarNotasComSala(notas);
    }
  });

  OBR.broadcast.onMessage("solaria/nota-excluida", async (e) => {
    const idExcluir = e.data;
    if (!idExcluir) return;

    let notas = JSON.parse(localStorage.getItem("solaria_notas_multiplas") || "[]");
    notas = notas.filter(n => n.id !== idExcluir);
    localStorage.setItem("solaria_notas_multiplas", JSON.stringify(notas));

    if (currentRole === "GM") {
      await SolariaSync.sincronizarNotasComSala(notas);
    }
  });
}