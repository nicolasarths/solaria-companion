import { SolariaSync } from "../core/sync.js";
import { SheetStore } from "./fichas/store.js";
import { NotesStore } from "./anotacoes/notes-store.js";

export const Estado = {
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

let callbackRecarregarPainel = null;

export function registrarCallbackRecarregar(cb) {
  callbackRecarregarPainel = cb;
}

export function definirVisualizacao(role) {
  if (Estado.realRole !== "GM") {
    Estado.viewRole = "PLAYER";
  } else {
    Estado.viewRole = role;
  }

  const btnResetSala = document.getElementById("btn-reset-sala-painel");
  if (btnResetSala) {
    btnResetSala.style.display = Estado.realRole === "GM" ? "flex" : "none";
  }

  const badge = document.getElementById("role-badge");
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

  if (typeof callbackRecarregarPainel === "function") {
    callbackRecarregarPainel();
  }
}

export function configurarCargos(realRole) {
  Estado.realRole = realRole;
  definirVisualizacao(realRole);

  if (realRole === "GM") {
    SheetStore.carregar();
    NotesStore.carregar();
    SolariaSync.sincronizarFichasComSala(SheetStore.fichas);
    SolariaSync.sincronizarNotasComSala(NotesStore.notas);
  }
}