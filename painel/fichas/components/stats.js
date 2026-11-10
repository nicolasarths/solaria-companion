import { calcularNovoStat } from "./calc.js";

const STATS_CHAVES = [
  { id: "pv", label: "PV", cor: "#f7768e" },
  { id: "pm", label: "PM", cor: "#7aa2f7" },
  { id: "rm", label: "RM", cor: "#e0af68" },
  { id: "cd", label: "CD", cor: "#bb9af7" },
  { id: "atk", label: "ATK", cor: "#73daca" }
];

/**
 * Normaliza o objeto de stats garantindo que cada atributo tenha { atual, max }.
 * Mantém retrocompatibilidade se existirem fichas antigas salvas com números simples.
 */
export function normalizarStats(statsRaw = {}) {
  const norm = {};
  STATS_CHAVES.forEach(({ id }) => {
    const s = statsRaw[id];
    if (typeof s === "object" && s !== null) {
      norm[id] = {
        atual: parseFloat(s.atual ?? s.max ?? 0),
        max: parseFloat(s.max ?? s.atual ?? 0)
      };
    } else {
      const val = parseFloat(s ?? 0) || 0;
      norm[id] = { atual: val, max: val };
    }
  });
  return norm;
}

/**
 * Renderiza a grade de stats no card principal da ficha com inputs inline de cálculo rápido.
 */
export function renderStatsCard(statsRaw = {}, fichaId = "") {
  const stats = normalizarStats(statsRaw);

  let html = `<div class="stats-badge-grid" data-ficha-id="${fichaId}">`;

  STATS_CHAVES.forEach(({ id, label, cor }) => {
    const item = stats[id];
    html += `
      <div class="stat-pill" style="border-top: 2px solid ${cor};">
        <span class="stat-pill-label">${label}</span>
        <div class="stat-values-row">
          <input 
            type="text" 
            class="stat-calc-input stat-input-cur" 
            data-ficha-id="${fichaId}" 
            data-stat="${id}" 
            data-sub="atual" 
            title="Valor Atual (digite -10, +5, /2, etc)" 
            value="${item.atual}"
          />
          <span class="stat-slash">/</span>
          <input 
            type="text" 
            class="stat-calc-input stat-input-max" 
            data-ficha-id="${fichaId}" 
            data-stat="${id}" 
            data-sub="max" 
            title="Valor Máximo" 
            value="${item.max}"
          />
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

/**
 * Liga os ouvintes de cálculo matemático dinâmico nos inputs dos cards.
 */
export function vincularCalculosCard(container, aoAtualizarFicha) {
  container.querySelectorAll(".stat-calc-input").forEach(input => {
    // Impede que o clique no input expanda/feche o card da ficha
    input.addEventListener("click", (e) => e.stopPropagation());

    const aplicarOperacao = () => {
      const fichaId = input.dataset.fichaId;
      const statId = input.dataset.stat;
      const sub = input.dataset.sub; // "atual" ou "max"
      const valorDigitado = input.value.trim();

      aoAtualizarFicha(fichaId, (ficha) => {
        ficha.stats = normalizarStats(ficha.stats);
        const valorAntigo = ficha.stats[statId][sub];
        const novoValor = calcularNovoStat(valorAntigo, valorDigitado);

        ficha.stats[statId][sub] = novoValor;
        input.value = novoValor;
      });
    };

    input.addEventListener("change", aplicarOperacao);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
  });
}

/**
 * Renderiza o formulário completo de edição de stats (com Atual e Max).
 */
export function renderStatsForm(statsRaw = {}) {
  const stats = normalizarStats(statsRaw);

  let html = `
    <div class="section-label" style="margin-top:10px;">Atributos / Stats (Atual / Máx)</div>
    <div class="stats-badge-grid">
  `;

  STATS_CHAVES.forEach(({ id, label, cor }) => {
    const item = stats[id];
    html += `
      <div class="stat-pill" style="border-top: 2px solid ${cor};">
        <span class="stat-pill-label">${label}</span>
        <div class="stat-values-row">
          <input type="text" id="form-st-${id}-cur" class="stat-calc-input" placeholder="Atual" value="${item.atual}">
          <span class="stat-slash">/</span>
          <input type="text" id="form-st-${id}-max" class="stat-calc-input" placeholder="Máx" value="${item.max}">
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

/**
 * Coleta os dados preenchidos no formulário aplicando o cálculo caso alguém digite fórmulas.
 */
export function getStatsFormData(container, statsAntigos = {}) {
  const antigos = normalizarStats(statsAntigos);
  const resultado = {};

  STATS_CHAVES.forEach(({ id }) => {
    const inputCur = container.querySelector(`#form-st-${id}-cur`)?.value || "0";
    const inputMax = container.querySelector(`#form-st-${id}-max`)?.value || "0";

    const valorCurAntigo = antigos[id]?.atual ?? 0;
    const valorMaxAntigo = antigos[id]?.max ?? 0;

    resultado[id] = {
      atual: calcularNovoStat(valorCurAntigo, inputCur),
      max: calcularNovoStat(valorMaxAntigo, inputMax)
    };
  });

  return resultado;
}