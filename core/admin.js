import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { METADATA_HUD_KEY, METADATA_BTN_FICHA_KEY } from "../hud/token-hud.js";

export function executarLimpezaCacheLocal(elementoStatus = null) {
  if (!window.confirm("Deseja apagar os dados locais do Solaria salvos neste navegador?")) return;

  Object.keys(localStorage)
    .filter((k) => k.startsWith("solaria_"))
    .forEach((k) => localStorage.removeItem(k));

  if (elementoStatus) {
    elementoStatus.textContent = "Cache local limpo! Recarregando...";
    elementoStatus.style.color = "#9ece6a";
  }
  try { OBR.notification.show("Armazenamento local zerado!"); } catch (_) {}
  setTimeout(() => location.reload(), 400);
}

export async function executarResetSala(elementoStatus = null) {
  if (!window.confirm("ATENÇÃO: Deseja apagar todas as fichas, notas e combate da SALA do Owlbear? (Apenas GM)")) return;

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
    const huds = itens.filter((i) =>
      i.metadata?.[METADATA_HUD_KEY] ||
      i.metadata?.[METADATA_BTN_FICHA_KEY] ||
      i.id.startsWith("solaria_hud_")
    );

    if (huds.length > 0) {
      await OBR.scene.items.deleteItems(huds.map((h) => h.id));
    }

    if (elementoStatus) {
      elementoStatus.textContent = "Sala e HUDs do mapa resetados!";
      elementoStatus.style.color = "#9ece6a";
    }
    try { OBR.notification.show("Sala do Owlbear e HUDs resetados! 🧹"); } catch (_) {}
  } catch (err) {
    if (elementoStatus) {
      elementoStatus.textContent = "Erro: " + err.message;
      elementoStatus.style.color = "#f7768e";
    } else {
      alert("Erro ao resetar sala: " + err.message);
    }
  }
}