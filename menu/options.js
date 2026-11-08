import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { criarFichaOption } from "./criar-ficha.js";

// Lista central de todas as opções de menu de contexto da extensão
const listaOpcoes = [
  criarFichaOption
];

export async function registrarMenusContexto(helpers) {
  const currentRole = await OBR.player.getRole();

  for (const item of listaOpcoes) {
    // Filtra opções restritas ao Mestre
    if (item.roleRequired && item.roleRequired !== currentRole) {
      continue;
    }

    OBR.contextMenu.create({
      id: item.id,
      icons: item.config.icons,
      onClick: async (context) => {
        await item.onClick(context, helpers);
      }
    });
  }
}