import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

const ID_PAINEL = "solaria-painel-inferior-direito";

export const Estado = {
  // Padrão seguro inicial: sempre PLAYER até confirmação do SDK
  realRole: "PLAYER",
  viewRole: "PLAYER",
  get role() {
    return this.viewRole;
  },
  set role(val) {
    this.viewRole = val;
  },
  abaAtiva: localStorage.getItem("solaria_aba_ativa") || null,
  modulos: {},
  dimensoes: JSON.parse(localStorage.getItem("solaria_painel_dimensoes") || '{"width":480,"height":680}'),
  irParaCard(aba, idCard) {
    const btn = document.querySelector(`[data-tab="${aba}"]`);
    if (btn) btn.click();
    setTimeout(() => {
      const card = document.getElementById(`card-${idCard}`);
      if (card) {
        card.classList.add("open");
        card.classList.add("is-open");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }
};

export async function aplicarDimensoes(largura, altura) {
  const w = Math.max(340, Math.min(largura, window.screen.width - 40));
  const h = Math.max(400, Math.min(altura, window.screen.height - 100));

  Estado.dimensoes = { width: w, height: h };
  localStorage.setItem("solaria_painel_dimensoes", JSON.stringify(Estado.dimensoes));

  try {
    await OBR.popover.setWidth(ID_PAINEL, Math.round(w));
    await OBR.popover.setHeight(ID_PAINEL, Math.round(h));
  } catch (_) {}
}

function configurarArrasto() {
  const elTop = document.getElementById("resize-top");
  const elLeft = document.getElementById("resize-left");
  const elCorner = document.getElementById("resize-corner");

  function iniciarRedimensionamento(e, redimensionaW, redimensionaH) {
    e.preventDefault();
    const startX = e.screenX;
    const startY = e.screenY;
    const startW = Estado.dimensoes.width;
    const startH = Estado.dimensoes.height;

    const onPointerMove = (ev) => {
      let novoW = startW;
      let novoH = startH;

      if (redimensionaW) {
        novoW = startW + (startX - ev.screenX);
      }
      if (redimensionaH) {
        novoH = startH + (startY - ev.screenY);
      }

      aplicarDimensoes(novoW, novoH);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  elTop?.addEventListener("pointerdown", (e) => iniciarRedimensionamento(e, false, true));
  elLeft?.addEventListener("pointerdown", (e) => iniciarRedimensionamento(e, true, false));
  elCorner?.addEventListener("pointerdown", (e) => iniciarRedimensionamento(e, true, true));

  const btnPreset = document.getElementById("btn-toggle-size");
  const presets = [
    { label: "📐 Médio", width: 480, height: 680 },
    { label: "📐 Amplo", width: 660, height: 760 },
    { label: "📐 Max", width: 860, height: 860 }
  ];
  let presetIdx = 0;

  btnPreset?.addEventListener("click", () => {
    presetIdx = (presetIdx + 1) % presets.length;
    const p = presets[presetIdx];
    btnPreset.textContent = p.label;
    aplicarDimensoes(p.width, p.height);
  });
}

export async function carregarPainel() {
  const res = await fetch("../modulos.json");
  Estado.modulos = await res.json();

  const tabsBar = document.getElementById("tabs-bar");
  const tabsContainer = document.getElementById("tabs-container");
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

const badge = document.getElementById("role-badge");

export function definirVisualizacao(role) {
  if (Estado.realRole !== "GM") {
    Estado.viewRole = "PLAYER";
  } else {
    Estado.viewRole = role;
  }

  if (badge) {
    if (Estado.realRole !== "GM") {
      badge.textContent = "Visão: Jogador";
      badge.className = "role-badge role-player";
      badge.style.cursor = "default";
      badge.style.pointerEvents = "none";
      badge.title = "";
    } else {
      badge.textContent = Estado.viewRole === "GM" ? "Visão: Mestre (GM)" : "Visão: Jogador";
      badge.className = `role-badge ${Estado.viewRole === "GM" ? "role-gm" : "role-player"}`;
      badge.style.cursor = "pointer";
      badge.style.pointerEvents = "auto";
      badge.title = "Clique para alternar modo de teste (Mestre / Jogador)";
    }
  }

  carregarPainel();
}

export function configurarCargos(realRole) {
  Estado.realRole = realRole;
  definirVisualizacao(realRole);
}

export const definirCargo = configurarCargos;

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
    const role = await OBR.player.getRole();
    configurarCargos(role);
  }
});

// Fallback seguro: se não estiver dentro de um iframe do Owlbear (teste direto em aba avulsa),
// libera GM apenas se for janela raiz (window.self === window.top). Dentro do Owlbear, mantém PLAYER.
setTimeout(() => {
  if (!inicializado) {
    inicializado = true;
    configurarArrasto();
    const isStandalone = window.self === window.top;
    configurarCargos(isStandalone ? "GM" : "PLAYER");
  }
}, 500);