import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

export const METADATA_KEY = "solaria/sheetId";

export async function vincularTokenAoId(tokenId, sheetId) {
  if (!tokenId) return;
  try {
    await OBR.scene.items.updateItems([tokenId], (itens) => {
      for (const it of itens) it.metadata[METADATA_KEY] = sheetId;
    });
  } catch (_) {}
}

export async function desvincularToken(tokenId) {
  if (!tokenId) return;
  try {
    await OBR.scene.items.updateItems([tokenId], (itens) => {
      for (const it of itens) delete it.metadata[METADATA_KEY];
    });
  } catch (_) {}
}

export async function selecionarTokenNoGrid(tokenId) {
  if (tokenId) await OBR.player.select([tokenId]);
}

export async function obterDadosTokenSelecionado() {
  const selection = await OBR.player.getSelection();
  if (!selection || !selection.length) return null;

  const items = await OBR.scene.items.getItems([selection[0]]);
  const it = items[0];
  if (!it) return null;

  return {
    tokenId: it.id,
    tokenNome: it.text?.plainText || (it.name !== "Image" ? it.name : "") || "Token"
  };
}

export function iniciarOuvintesOwlbear(onFocarFicha, onCriarFicha) {
  // Foca a ficha quando clica no token no mapa
  OBR.player.onChange(async (player) => {
    if (!player.selection?.length) return;
    try {
      const items = await OBR.scene.items.getItems(player.selection);
      const sheetId = items[0]?.metadata?.[METADATA_KEY];
      if (sheetId) onFocarFicha(sheetId);
    } catch (_) {}
  });

  // Escuta clique do botão direito (menu de contexto)
  OBR.broadcast.onMessage("solaria/criar-ficha-token", (e) => {
    onCriarFicha(e.data.tokenId, e.data.tokenNome);
  });
}