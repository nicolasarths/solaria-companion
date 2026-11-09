import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { NotesStore } from "./notes-store.js";
import { criarGerenciadorNotas } from "./notes-list.js";
import { SolariaSync } from "../../core/sync.js";

/**
 * Ponto de entrada da aba de Anotações (Solaria)
 */
export function render(container, Estado) {
  if (!document.getElementById("css-anotacoes")) {
    const link = document.createElement("link");
    link.id = "css-anotacoes";
    link.rel = "stylesheet";
    link.href = "./anotacoes/style.css";
    document.head.appendChild(link);
  }

  NotesStore.carregar();

  container.innerHTML = "";

  const isGM = Estado.role === "GM";

  const layout = document.createElement("div");
  layout.className = "notes-module-layout";
  layout.innerHTML = `
    <div class="notes-topbar">
      <span class="notes-topbar-title">Diário & Anotações</span>
      ${isGM ? `<button type="button" id="btn-add-note" class="btn-nova-nota">+ Nova Anotação</button>` : ""}
    </div>
    <div id="notes-cards-container" class="notes-cards-list"></div>
  `;
  container.appendChild(layout);

  const containerCards = layout.querySelector("#notes-cards-container");
  const gerenciador = criarGerenciadorNotas(containerCards, Estado);

  if (isGM) {
    layout.querySelector("#btn-add-note")?.addEventListener("click", () => {
      gerenciador.adicionarNota();
    });
  }

  // Sincronização contínua com os metadados da sala
  SolariaSync.iniciarOuvinteSala({
    onNotasRecebidas: (notasPublicas) => {
      if (Estado.realRole !== "GM") {
        NotesStore.mesclarNotasPublicas(notasPublicas);
        gerenciador.renderizar();
      }
    }
  });

  // Atualização em tempo real quando aberto no navegador do Jogador
  OBR.broadcast.onMessage("solaria/nota-sync", () => {
    NotesStore.carregar();
    gerenciador.renderizar();
  });

  OBR.broadcast.onMessage("solaria/nota-excluida", () => {
    NotesStore.carregar();
    gerenciador.renderizar();
  });

  gerenciador.renderizar();
}