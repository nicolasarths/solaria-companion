import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { Estado, configurarCargos, definirVisualizacao, registrarCallbackRecarregar } from "./estado.js";
import { configurarArrasto } from "./painel-resize.js";
import { METADATA_HUD_KEY, METADATA_BTN_FICHA_KEY } from "./fichas/token-hud.js";

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

  for (let i = 0; i < nomesPastas.length; i++) {
    const pasta = nomesPastas[i];
    const dadosModulo = Estado.modulos[pasta];
    const isAtiva = pasta === Estado.abaAtiva;

    const btn = document.createElement("button");
    btn.className = `tab-btn ${isAtiva ? "active" : ""}`;
    btn.dataset.tab = pasta;
    btn.textContent = pasta;
    btn.addEventListener("click", () => {
      Estado.abaAtiva = pasta;
      localStorage.setItem("solaria_aba_ativa", pasta);
      document.querySelectorAll(".tab-btn, .tab-content").forEach(el => el.classList.remove("active"));
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
      renderizarListaPadrao(section, pasta, dadosModulo.registros);
    }
  }
}

function renderizarListaPadrao(section, pasta, registros) {
  section.innerHTML = `
    <input type="text" placeholder="Buscar em ${pasta}..." class="search-input">
    <div class="cards-list" style="display:flex; flex-direction:column; gap:8px;"></div>
  `;
  const input = section.querySelector(".search-input");
  const list = section.querySelector(".cards-list");

  const desenhar = () => {
    const termo = input.value.toLowerCase();
    list.innerHTML = "";
    (registros || [])
      .filter(item => (Estado.role === "GM" || item.visivelPlayer) && item.nome.toLowerCase().includes(termo))
      .forEach(item => {
        const card = document.createElement("div");
        card.className = `card ${!item.visivelPlayer ? "card-gm-only" : ""}`;
        card.id = `card-${item.id}`;
        card.innerHTML = `
          <div class="card-header">
            <span>${item.nome} ${!item.visivelPlayer ? "🔒" : ""}</span>
            <span class="card-tag">${item.tag || pasta}</span>
          </div>
          <div class="card-body">
            <div>${item.desc || ""}</div>
            ${Estado.role === "GM" && item.segredoGM ? `<div class="gm-secret"><strong>Segredo GM:</strong> ${item.segredoGM}</div>` : ""}
          </div>
        `;
        card.addEventListener("click", () => card.classList.toggle("open"));
        list.appendChild(card);
      });
  };

  input.addEventListener("input", desenhar);
  desenhar();
}

function configurarBotoesCachePainel() {
  const btnLimparCache = document.getElementById("btn-limpar-cache-painel");
  const btnResetSala = document.getElementById("btn-reset-sala-painel");

  if (btnLimparCache) {
    btnLimparCache.addEventListener("click", () => {
      const ok = window.confirm("Deseja apagar os dados locais do Solaria salvos neste navegador e recarregar?");
      if (!ok) return;

      Object.keys(localStorage)
        .filter(k => k.startsWith("solaria_"))
        .forEach(k => localStorage.removeItem(k));

      try { OBR.notification.show("Armazenamento local limpo! 🧹"); } catch (_) {}
      setTimeout(() => location.reload(), 300);
    });
  }

  if (btnResetSala) {
    btnResetSala.addEventListener("click", async () => {
      const ok = window.confirm("ATENÇÃO: Deseja apagar todas as fichas e notas da SALA do Owlbear Rodeo? (Ação irreversível)");
      if (!ok) return;

      try {
        const role = await OBR.player.getRole();
        if (role !== "GM") {
          alert("Apenas o Mestre pode resetar os dados da sala.");
          return;
        }

        await OBR.room.setMetadata({
          "solaria/sync_fichas": [],
          "solaria/sync_notas": []
        });

        const itens = await OBR.scene.items.getItems();
        const huds = itens.filter(i => 
          i.metadata?.[METADATA_HUD_KEY] || 
          i.metadata?.[METADATA_BTN_FICHA_KEY] || 
          i.id.startsWith("solaria_hud_")
        );
        if (huds.length > 0) {
          await OBR.scene.items.deleteItems(huds.map(h => h.id));
        }

        try { OBR.notification.show("Sala do Owlbear e HUDs resetados! 🧹"); } catch (_) {}
        setTimeout(() => location.reload(), 300);
      } catch (err) {
        alert("Erro ao resetar sala: " + err.message);
      }
    });
  }
}

// Conecta o recarregamento ao mudar de cargo (Mestre / Jogador)
registrarCallbackRecarregar(() => carregarPainel());

const badge = document.getElementById("role-badge");
if (badge) {
  badge.addEventListener("click", () => {
    if (Estado.realRole !== "GM") return;
    definirVisualizacao(Estado.viewRole === "GM" ? "PLAYER" : "GM");
  });
}

let inicializado = false;

OBR.onReady(async () => {
  if (!inicializado) {
    inicializado = true;
    configurarArrasto();
    configurarBotoesCachePainel();
    const role = await OBR.player.getRole();
    configurarCargos(role);
  }
});

// Fallback de teste local fora do iframe do Owlbear
setTimeout(() => {
  if (!inicializado) {
    inicializado = true;
    configurarArrasto();
    configurarBotoesCachePainel();
    const isStandalone = window.self === window.top;
    configurarCargos(isStandalone ? "GM" : "PLAYER");
  }
}, 500);