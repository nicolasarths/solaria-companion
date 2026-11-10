import { buildPath, buildText, buildShape } from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

/**
 * Constrói o anel externo indicando estado crítico (laranja) ou morto (vermelho)
 */
export function construirAnelStatus({ token, centerX, centerY, tokenDiametro, corAnel, visivel, fichaId, metadataKey }) {
  return buildShape()
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
    .metadata({ [metadataKey]: true, sheetId: fichaId, tipo: "status-ring" })
    .build();
}

/**
 * Constrói a caveira centralizada quando a criatura é derrotada (PV <= 0)
 */
export function construirCaveiraMorte({ token, centerX, centerY, tokenDiametro, visivel, fichaId, metadataKey }) {
  const skullFontSize = Math.max(30, Math.round(tokenDiametro * 0.35));
  const boxSize = skullFontSize * 2;

  return buildText()
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
    .metadata({ [metadataKey]: true, sheetId: fichaId, tipo: "status-morte" })
    .build();
}

/**
 * Constrói o par de elementos (fundo vetorial + texto clicável) de um badge de status
 */
export function construirBadgeStat({ token, bx, by, badgeW, badgeH, comandos, statCfg, textoValor, visivel, fichaId, metadataKey }) {
  const metaComum = {
    [metadataKey]: true,
    sheetId: fichaId,
    statId: statCfg.id,
    statLabel: statCfg.label,
    statCor: statCfg.cor
  };

  const badgeFundo = buildPath()
    .commands(comandos)
    .position({ x: bx, y: by })
    .fillColor("#14161f")
    .fillOpacity(0.94)
    .strokeColor(statCfg.cor)
    .strokeWidth(2)
    .attachedTo(token.id)
    .layer("ATTACHMENT")
    .disableHit(false)
    .locked(true)
    .visible(visivel)
    .zIndex(10)
    .metadata(metaComum)
    .build();

  const badgeTexto = buildText()
    .textType("PLAIN")
    .plainText(`${statCfg.label} ${textoValor}`)
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

  return [badgeFundo, badgeTexto];
}

/**
 * Constrói o botão orbital de pergaminho (📜) para abrir a ficha com um clique
 */
export function construirBotaoFicha({ token, centerX, centerY, tokenRaio, visivel, fichaId, metadataBtnKey }) {
  const emojiSize = 30;
  const emojiX = Math.round(centerX + tokenRaio * 0.72 - emojiSize / 2);
  const emojiY = Math.round(centerY + tokenRaio * 0.72 - emojiSize / 2);

  return buildText()
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
      [metadataBtnKey]: true,
      sheetId: fichaId,
      tokenId: token.id
    })
    .build();
}