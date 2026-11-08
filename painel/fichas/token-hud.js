import OBR, { buildPath, buildText, buildShape, Command } from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { normalizarStats } from "./stats.js";

export const METADATA_HUD_KEY = "solaria/tokenHudItem";
export const METADATA_BTN_FICHA_KEY = "solaria/btnAbrirFicha";

const ORBITA_STATS = [
  { id: "atk", label: "ATK", cor: "#73daca", angulo: 165 },
  { id: "pv",  label: "PV",  cor: "#f7768e", angulo: 215 },
  { id: "pm",  label: "PM",  cor: "#7aa2f7", angulo: 270 },
  { id: "rm",  label: "RM",  cor: "#e0af68", angulo: 325 },
  { id: "cd",  label: "CD",  cor: "#bb9af7", angulo: 15 }
];

function formatarValorStat(id, itemStat) {
  const cur = itemStat?.atual ?? 0;
  const max = itemStat?.max ?? cur;
  if (id === "pv" || id === "pm") return `${cur}/${max}`;
  if (cur === max || !max) return String(cur);
  return `${cur}/${max}`;
}

function criarComandosRetanguloArredondado(w, h, r) {
  const raio = Math.min(r, w / 2, h / 2);
  return [
    [Command.MOVE, raio, 0],
    [Command.LINE, w - raio, 0],
    [Command.QUAD, w, 0, w, raio],
    [Command.LINE, w, h - raio],
    [Command.QUAD, w, h, w - raio, h],
    [Command.LINE, raio, h],
    [Command.QUAD, 0, h, 0, h - raio],
    [Command.LINE, 0, raio],
    [Command.QUAD, 0, 0, raio, 0],
    [Command.CLOSE]
  ];
}

export async function removerHudToken(tokenId, fichaId = null) {
  if (!tokenId && !fichaId) return;
  try {
    const itensCena = await OBR.scene.items.getItems();
    const itensAntigos = itensCena.filter((item) => {
      const isHud = item.metadata?.[METADATA_HUD_KEY] || item.metadata?.[METADATA_BTN_FICHA_KEY];
      const matchToken = tokenId && item.attachedTo === tokenId;
      const matchFicha = fichaId && item.metadata?.sheetId === fichaId;
      return isHud && (matchToken || matchFicha);
    });

    if (itensAntigos.length > 0) {
      await OBR.scene.items.deleteItems(itensAntigos.map((i) => i.id));
    }
  } catch (err) {
    console.error("Erro ao remover HUD:", err);
  }
}

export async function atualizarHudToken(ficha, tokenIdEspecifico = null) {
  const tokenId = tokenIdEspecifico || ficha.tokenId;
  if (!tokenId) return;

  try {
    await removerHudToken(tokenId, ficha.id);

    const items = await OBR.scene.items.getItems([tokenId]);
    const token = items[0];
    if (!token) return;

    let sceneDpi = 150;
    try { sceneDpi = await OBR.grid.getDpi(); } catch (_) {}

    const scaleX = Math.abs(token.scale?.x ?? 1);
    const scaleY = Math.abs(token.scale?.y ?? 1);
    const imgW = token.image?.width || 150;
    const imgH = token.image?.height || 150;
    const tokenDpi = token.grid?.dpi || 150;

    const tokenWidth = (imgW / tokenDpi) * sceneDpi * scaleX;
    const tokenHeight = (imgH / tokenDpi) * sceneDpi * scaleY;

    const offsetX = token.grid?.offset?.x ?? (imgW / 2);
    const offsetY = token.grid?.offset?.y ?? (imgH / 2);
    
    const centerX = token.position.x + ((imgW / 2 - offsetX) / tokenDpi) * sceneDpi * scaleX;
    const centerY = token.position.y + ((imgH / 2 - offsetY) / tokenDpi) * sceneDpi * scaleY;

    const tokenRaio = Math.min(tokenWidth, tokenHeight) / 2;
    const tokenDiametro = tokenRaio * 2;

    const badgeW = 78;
    const badgeH = 24;
    const cornerRadius = 8;
    const orbitalRadius = tokenRaio + badgeH / 2 + 8;

    const visivel = ficha.visivelPlayer !== false;
    const statsNorm = normalizarStats(ficha.stats);
    const novosItens = [];
    const comandosArredondados = criarComandosRetanguloArredondado(badgeW, badgeH, cornerRadius);

    // LER CONFIGURAÇÃO GLOBAL: Stats ativados? (Default: true)
    const statsAtivosGlobais = localStorage.getItem("solaria_exibir_stats") !== "false";

    if (statsAtivosGlobais) {
      const pvStat = statsNorm.pv || { atual: 0, max: 0 };
      const curPv = Number(pvStat.atual) || 0;
      const maxPv = Number(pvStat.max) || curPv;

      const isMorto = curPv <= 0;
      const isCritico = !isMorto && maxPv > 0 && curPv < (maxPv * 0.10);

      // 1. Círculo de Estado
      if (isMorto || isCritico) {
        const corAnel = isMorto ? "#e63946" : "#ff9e3b";
        const statusRing = buildShape()
          .shapeType("CIRCLE")
          .width(tokenDiametro)
          .height(tokenDiametro)
          .position({ x: centerX, y: centerY })
          .fillColor("#000000")
          .fillOpacity(0)
          .strokeColor(corAnel)
          .strokeWidth(6)
          .attachedTo(token.id)
          .layer("ATTACHMENT")
          .disableHit(true)
          .locked(true)
          .visible(visivel)
          .zIndex(5)
          .metadata({ [METADATA_HUD_KEY]: true, sheetId: ficha.id, tipo: "status-ring" })
          .build();
        novosItens.push(statusRing);
      }

      // 2. Caveira Centralizada
      if (isMorto) {
        const skullFontSize = Math.max(30, Math.round(tokenDiametro * 0.35)); 
        const boxSize = skullFontSize * 2; 

        const skullText = buildText()
          .textType("PLAIN")
          .plainText("💀")
          .position({ x: Math.round(centerX - boxSize / 2), y: Math.round(centerY - boxSize / 2) })
          .width(boxSize)
          .height(boxSize)
          .fontSize(skullFontSize)
          .textAlign("CENTER")
          .textAlignVertical("MIDDLE")
          .attachedTo(token.id)
          .layer("TEXT")
          .disableHit(true)
          .locked(true)
          .visible(visivel)
          .zIndex(25)
          .metadata({ [METADATA_HUD_KEY]: true, sheetId: ficha.id, tipo: "status-morte" })
          .build();
        novosItens.push(skullText);
      }

      // 3. Badges (Órbita de Stats)
      ORBITA_STATS.forEach((cfg) => {
        const rad = (cfg.angulo * Math.PI) / 180;
        const px = centerX + orbitalRadius * Math.cos(rad);
        const py = centerY + orbitalRadius * Math.sin(rad);
        const bx = Math.round(px - badgeW / 2);
        const by = Math.round(py - badgeH / 2);
        const textoValor = formatarValorStat(cfg.id, statsNorm[cfg.id]);
        
        const metaComum = { [METADATA_HUD_KEY]: true, sheetId: ficha.id, statId: cfg.id, statLabel: cfg.label, statCor: cfg.cor };

        const badgePath = buildPath()
          .commands(comandosArredondados)
          .position({ x: bx, y: by })
          .fillColor("#14161f")
          .fillOpacity(0.94)
          .strokeColor(cfg.cor)
          .strokeWidth(2)
          .attachedTo(token.id)
          .layer("ATTACHMENT")
          .disableHit(false)
          .locked(true)
          .visible(visivel)
          .zIndex(10)
          .metadata(metaComum)
          .build();

        const badgeText = buildText()
          .textType("PLAIN")
          .plainText(`${cfg.label} ${textoValor}`)
          .position({ x: bx, y: by })
          .width(badgeW)
          .height(badgeH)
          .fontSize(12)
          .fontWeight(700)
          .fillColor("#ffffff")
          .fillOpacity(1)
          .strokeColor("#000000")
          .strokeWidth(0)
          .textAlign("CENTER")
          .textAlignVertical("MIDDLE")
          .attachedTo(token.id)
          .layer("TEXT")
          .disableHit(true)
          .locked(true)
          .visible(visivel)
          .zIndex(20)
          .metadata(metaComum)
          .build();

        novosItens.push(badgePath, badgeText);
      });
    }

    // 4. Botão Flutuante (📜) - Sempre gerado para não perder acesso à ficha
    const emojiSize = 30;
    const emojiX = Math.round(centerX + tokenRaio * 0.72 - emojiSize / 2);
    const emojiY = Math.round(centerY + tokenRaio * 0.72 - emojiSize / 2);

    const btnFichaText = buildText()
      .textType("PLAIN")
      .plainText("📜")
      .position({ x: emojiX, y: emojiY })
      .width(emojiSize)
      .height(emojiSize)
      .fontSize(18)
      .textAlign("CENTER")
      .textAlignVertical("MIDDLE")
      .attachedTo(token.id)
      .layer("TEXT")
      .disableHit(false)
      .locked(true)
      .visible(visivel)
      .zIndex(30)
      .metadata({
        [METADATA_BTN_FICHA_KEY]: true,
        sheetId: ficha.id,
        tokenId: token.id
      })
      .build();

    novosItens.push(btnFichaText);

    if (novosItens.length > 0) {
      await OBR.scene.items.addItems(novosItens);
    }
  } catch (err) {
    console.error("Erro ao desenhar HUD:", err);
  }
}

export async function sincronizarTodosHuds(fichas = []) {
  for (const f of fichas) {
    if (f.tokenId) await atualizarHudToken(f);
  }
}