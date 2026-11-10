import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { calcularNovoStat } from "./calc.js";
import { normalizarStats } from "./stats.js";
import { atualizarHudToken } from "./token-hud.js";
import { SolariaSync } from "../../core/sync.js";

const params = new URLSearchParams(window.location.search);
const sheetId = params.get("sheetId");
const statId = params.get("statId");
const statLabel = params.get("label") || statId?.toUpperCase();
const cor = params.get("cor") || "#7aa2f7";

document.documentElement.style.setProperty("--cor-borda", cor);
document.getElementById("stat-label").textContent = statLabel;

const fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
const ficha = fichas.find(f => f.id === sheetId);

const inpAtual = document.getElementById("inp-atual");
const inpMax = document.getElementById("inp-max");
const hintText = document.getElementById("hint-text");

let isEditavel = true;

OBR.onReady(async () => {
  const role = await OBR.player.getRole();
  const isGM = role === "GM";
  isEditavel = isGM || (ficha && ficha.editavelPlayer === true);

  if (!isEditavel) {
    inpAtual.setAttribute("readonly", "true");
    inpMax.setAttribute("readonly", "true");
    inpAtual.style.cursor = "default";
    inpMax.style.cursor = "default";
    hintText.textContent = "🔒 Apenas Leitura (Mestre não liberou edição)";
    hintText.style.color = "#f7768e";
  }
});

if (ficha) {
  document.getElementById("ficha-nome").textContent = ficha.nome;
  ficha.stats = normalizarStats(ficha.stats);
  inpAtual.value = ficha.stats[statId].atual;
  inpMax.value = ficha.stats[statId].max;
  setTimeout(() => {
    inpAtual.focus();
    inpAtual.select();
  }, 30);
}

let salvando = false;
async function salvarEFechar() {
  if (!ficha || salvando || !isEditavel) return;
  salvando = true;

  const antigoAtual = ficha.stats[statId].atual;
  const antigoMax = ficha.stats[statId].max;

  ficha.stats[statId].atual = calcularNovoStat(antigoAtual, inpAtual.value);
  ficha.stats[statId].max = calcularNovoStat(antigoMax, inpMax.value);

  localStorage.setItem("solaria_fichas_custom", JSON.stringify(fichas));

  try {
    const role = await OBR.player.getRole();
    if (role === "GM") {
      await atualizarHudToken(ficha);
      await SolariaSync.sincronizarFichasComSala(fichas);
    }
    await OBR.broadcast.sendMessage("solaria/ficha-sync", ficha);
    await OBR.broadcast.sendMessage("solaria/ficha-stat-atualizado", { sheetId });
  } catch (_) {}

  try {
    await OBR.popover.close("solaria-quick-stat-editor");
  } catch (_) {}
}

[inpAtual, inpMax].forEach(inp => {
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") salvarEFechar();
    if (e.key === "Escape") {
      OBR.popover.close("solaria-quick-stat-editor");
    }
  });
});