import { Command } from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

export const ORBITA_STATS = [
  { id: "atk", label: "ATK", cor: "#73daca", angulo: 165 },
  { id: "pv",  label: "PV",  cor: "#f7768e", angulo: 215 },
  { id: "pm",  label: "PM",  cor: "#7aa2f7", angulo: 270 },
  { id: "rm",  label: "RM",  cor: "#e0af68", angulo: 325 },
  { id: "cd",  label: "CD",  cor: "#bb9af7", angulo: 15 }
];

export const BADGE_CONFIG = {
  width: 78,
  height: 24,
  radius: 8,
  spacing: 8
};

/**
 * Calcula dimensões escaladas e centro real do token no grid
 */
export function calcularGeometriaToken(token, sceneDpi = 150) {
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
  const orbitalRadius = tokenRaio + BADGE_CONFIG.height / 2 + BADGE_CONFIG.spacing;

  return {
    centerX,
    centerY,
    tokenRaio,
    tokenDiametro,
    orbitalRadius
  };
}

/**
 * Calcula a posição x, y do badge orbital baseado no ângulo em graus
 */
export function calcularPosicaoOrbital(centerX, centerY, orbitalRadius, anguloGraus, badgeW, badgeH) {
  const rad = (anguloGraus * Math.PI) / 180;
  const px = centerX + orbitalRadius * Math.cos(rad);
  const py = centerY + orbitalRadius * Math.sin(rad);

  return {
    bx: Math.round(px - badgeW / 2),
    by: Math.round(py - badgeH / 2)
  };
}

/**
 * Formata os valores exibidos nos badges orbitais (atual/max)
 */
export function formatarValorStat(id, itemStat) {
  const cur = itemStat?.atual ?? 0;
  const max = itemStat?.max ?? cur;
  if (id === "pv" || id === "pm") return `${cur}/${max}`;
  if (cur === max || !max) return String(cur);
  return `${cur}/${max}`;
}

/**
 * Comandos vetoriais de curva para retângulos arredondados do Owlbear
 */
export function criarComandosRetanguloArredondado(w, h, r) {
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