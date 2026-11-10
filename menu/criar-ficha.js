import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { resolverRota } from "../core/config.js";

export const criarFichaOption = {
  id: "solaria/context-menu-criar-ficha",
  roleRequired: "GM",
  config: {
    icons: [
      {
        icon: resolverRota("/favicon.svg"),
        label: "Criar Ficha",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER", coordinator: "||" },
            { key: "layer", value: "PROP", coordinator: "||" },
            { key: "type", value: "IMAGE" }
          ],
          permissions: ["UPDATE"]
        }
      }
    ]
  },
  async onClick(context, helpers) {
    const item = context.items[0];
    if (!item) return;

    const tokenId = item.id;
    const tokenNome = item.text?.plainText || (item.name && item.name !== "Image" ? item.name : "") || item.name || "Novo Token";

    // 1. Salva intenção para não perder se o painel estiver abrindo
    localStorage.setItem("solaria_acao_pendente", JSON.stringify({
      tipo: "CRIAR_FICHA",
      tokenId,
      tokenNome,
      timestamp: Date.now()
    }));

    // 2. Garante abertura ou foco no painel
    if (helpers?.abrirOuFocarPainel) {
      await helpers.abrirOuFocarPainel();
    }

    // 3. Emite broadcast caso o painel já esteja ativo
    try {
      await OBR.broadcast.sendMessage("solaria/criar-ficha-token", {
        tokenId,
        tokenNome
      });
    } catch (_) {}
  }
};