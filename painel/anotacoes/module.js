import { NotesStore } from "./notes-store.js";
import { criarGerenciadorNotas } from "./notes-list.js";

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

  const layout = document.createElement("div");
  layout.className = "notes-module-layout";
  layout.innerHTML = `
    <div class="notes-topbar">
      <span class="notes-topbar-title">Diário & Anotações</span>
      <button type="button" id="btn-add-note" class="btn-nova-nota">+ Nova Anotação</button>
    </div>
    <div id="notes-cards-container" class="notes-cards-list"></div>
  `;
  container.appendChild(layout);

  const containerCards = layout.querySelector("#notes-cards-container");
  const gerenciador = criarGerenciadorNotas(containerCards, Estado);

  layout.querySelector("#btn-add-note").addEventListener("click", () => {
    gerenciador.adicionarNota();
  });

  gerenciador.renderizar();
}