import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { Estado, configurarCargos, definirVisualizacao, registrarCallbackRecarregar } from "./estado.js";
import { configurarArrasto } from "./painel-resize.js";
import { renderizarListaPadrao } from "./lista-padrao.js";
import { executarLimpezaCacheLocal, executarResetSala } from "../core/admin.js";

export async function carregarPainel() {
  const res = await fetch("../modulos.json");
  Estado.modulos = await res.json();

  const tabsBar = document.getElementById("tabs-bar");
  const tabsContainer = document.getElementById("tabs-container");
  if (!tabsBar || !tabsContainer) return;

  tabsBar.innerHTML = "";
  tabsContainer.innerHTML = "";

  const nomesPastas = Object.keys(Estado.modulos);
  if (!Estado.abaAtiva || !nomesPastas.includes(Estado.abaAtiva)) {
    Estado.abaAtiva = nomesPastas[0] || null;
  }

  for (const pasta of nomesPastas) {
    const dadosModulo = Estado.modulos[pasta];
    const isAtiva = pasta === Estado.abaAtiva;

    const btn = document.createElement("button");
    btn.className = `tab-btn ${isAtiva ? "active" : ""}`;
    btn.dataset.tab = pasta;
    btn.textContent = pasta;
    btn.addEventListener("click", () => {
      Estado.abaAtiva = pasta;
      localStorage.setItem("solaria_aba_ativa", pasta);
      document.querySelectorAll(".tab-btn, .tab-content").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${pasta}`)?.classList.add("active");
    });
    tabsBar.appendChild(btn);

    const section = document.createElement("section");
    section.id = `tab-${pasta}`;
    section.className = `tab-content ${isAtiva ? "active" : ""}`;
    tabsContainer.appendChild(section);

    if (dadosModulo.temCustomJS) {
      const mod = await import(`./${pasta}/module.js?v=${Date.now()}`);
      if (mod.render) mod.render(section, Estado);
    } else {
      renderizarListaPadrao(section, pasta, dadosModulo.registros, Estado);
    }
  }
}

// Botoes administrativos do topo do painel
document.getElementById("btn-limpar-cache-painel")?.addEventListener("click", () => {
  executarLimpezaCacheLocal();
});

document.getElementById("btn-reset-sala-painel")?.addEventListener("click", async () => {
  await executarResetSala();
});

// Alternancia de visao Mestre / Jogador
const badge = document.getElementById("role-badge");
if (badge) {
  badge.addEventListener("click", () => {
    if (Estado.realRole !== "GM") return;
    definirVisualizacao(Estado.viewRole === "GM" ? "PLAYER" : "GM");
  });
}

registrarCallbackRecarregar(() => carregarPainel());

OBR.onReady(async () => {
  configurarArrasto();
  const role = await OBR.player.getRole();
  configurarCargos(role);
});