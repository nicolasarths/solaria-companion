import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { normalizarStats } from "../painel/fichas/stats.js";
import {
  ORBITA_STATS,
  BADGE_CONFIG,
  calcularGeometriaToken,
  calcularPosicaoOrbital,
  formatarValorStat,
  criarComandosRetanguloArredondado
} from "./hud-math.js";
import {
  construirAnelStatus,
  construirCaveiraMorte,
  construirBadgeStat,
  construirBotaoFicha
} from "./hud-builders.js";

export const METADATA_HUD_KEY = "solaria/tokenHudItem";
export const METADATA_BTN_FICHA_KEY = "solaria/btnAbrirFicha";

// Fila assíncrona por token para impedir execuções concorrentes
const filaTokens = new Map();

/**
 * Remove todos os elementos de HUD vinculados ao token ou à ficha
 */
export async function removerHudToken(tokenId, fichaId = null) {
  if (!tokenId && !fichaId) return;
  try {
    const role = await OBR.player.getRole();
    if (role !== "GM") return;

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

/**
 * Ponto de entrada para desenhar ou atualizar os badges no mapa
 */
export async function atualizarHudToken(ficha, tokenIdEspecifico = null) {
  const tokenId = tokenIdEspecifico || ficha?.tokenId;
  if (!tokenId || !ficha) return;

  try {
    const role = await OBR.player.getRole();
    if (role !== "GM") return;
  } catch (_) {
    return;
  }

  const anterior = filaTokens.get(tokenId) || Promise.resolve();
  const proxima = anterior
    .catch(() => {})
    .then(() => _desenharHudInterno(ficha, tokenId))
    .finally(() => {
      if (filaTokens.get(tokenId) === proxima) {
        filaTokens.delete(tokenId);
      }
    });

  filaTokens.set(tokenId, proxima);
  return proxima;
}

async function _desenharHudInterno(ficha, tokenId) {
  try {
    await removerHudToken(tokenId, ficha.id);

    const items = await OBR.scene.items.getItems([tokenId]);
    const token = items[0];
    if (!token) return;

    let sceneDpi = 150;
    try { sceneDpi = await OBR.grid.getDpi(); } catch (_) {}

    const { centerX, centerY, tokenRaio, tokenDiametro, orbitalRadius } = calcularGeometriaToken(token, sceneDpi);
    const visivel = ficha.visivelPlayer !== false;
    const statsNorm = normalizarStats(ficha.stats);
    const novosItens = [];

    const statsAtivosGlobais = localStorage.getItem("solaria_exibir_stats") !== "false";

    if (statsAtivosGlobais) {
      const pvStat = statsNorm.pv || { atual: 0, max: 0 };
      const curPv = Number(pvStat.atual) || 0;
      const maxPv = Number(pvStat.max) || curPv;

      const isMorto = curPv <= 0;
      const isCritico = !isMorto && maxPv > 0 && curPv < (maxPv * 0.10);

      // 1. Círculo de Estado Crítico ou Derrotado
      if (isMorto || isCritico) {
        novosItens.push(construirAnelStatus({
          token,
          centerX,
          centerY,
          tokenDiametro,
          corAnel: isMorto ? "#e63946" : "#ff9e3b",
          visivel,
          fichaId: ficha.id,
          metadataKey: METADATA_HUD_KEY
        }));
      }

      // 2. Caveira Centralizada se Derrotado
      if (isMorto) {
        novosItens.push(construirCaveiraMorte({
          token,
          centerX,
          centerY,
          tokenDiametro,
          visivel,
          fichaId: ficha.id,
          metadataKey: METADATA_HUD_KEY
        }));
      }

      // 3. Badges orbitais dos atributos
      const comandos = criarComandosRetanguloArredondado(BADGE_CONFIG.width, BADGE_CONFIG.height, BADGE_CONFIG.radius);

      ORBITA_STATS.forEach((cfg) => {
        const { bx, by } = calcularPosicaoOrbital(centerX, centerY, orbitalRadius, cfg.angulo, BADGE_CONFIG.width, BADGE_CONFIG.height);
        const textoValor = formatarValorStat(cfg.id, statsNorm[cfg.id]);

        const badgeItens = construirBadgeStat({
          token,
          bx,
          by,
          badgeW: BADGE_CONFIG.width,
          badgeH: BADGE_CONFIG.height,
          comandos,
          statCfg: cfg,
          textoValor,
          visivel,
          fichaId: ficha.id,
          metadataKey: METADATA_HUD_KEY
        });

        novosItens.push(...badgeItens);
      });
    }

    // 4. Botão Flutuante (📜)
    novosItens.push(construirBotaoFicha({
      token,
      centerX,
      centerY,
      tokenRaio,
      visivel,
      fichaId: ficha.id,
      metadataBtnKey: METADATA_BTN_FICHA_KEY
    }));

    if (novosItens.length > 0) {
      await OBR.scene.items.addItems(novosItens);
    }
  } catch (err) {
    console.error("Erro ao desenhar HUD:", err);
  }
}

/**
 * Sincroniza os badges de todos os tokens que possuem ficha vinculada
 */
export async function sincronizarTodosHuds(fichas = []) {
  try {
    const role = await OBR.player.getRole();
    if (role !== "GM") return;
    for (const f of fichas) {
      if (f.tokenId) await atualizarHudToken(f);
    }
  } catch (_) {}
}