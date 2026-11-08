import { criarRichEditor } from "../../ui/rich-editor.js";

/**
 * Monta o elemento DOM de um cartão individual com editor e anexos próprios
 */
export function criarCardNota({
  nota,
  aberta,
  fichasDisponiveis = [],
  onToggle,
  onTituloChange,
  onConteudoChange,
  onAnexosChange,
  onExcluir,
  onNavegarFicha
}) {
  const card = document.createElement("div");
  card.className = `note-card ${aberta ? "" : "is-collapsed"}`;
  card.id = `note-card-${nota.id}`;

  card.innerHTML = `
    <div class="note-card-header">
      <button type="button" class="btn-collapse-arrow" title="Colapsar / Expandir">▼</button>
      <input type="text" class="note-title-input" value="${nota.titulo || "Sem Título"}" placeholder="Título da anotação...">
      <span class="note-save-badge">● Guardado</span>
      <button type="button" class="btn-delete-note" title="Clique duas vezes para excluir">✕</button>
    </div>
    <div class="note-card-body">
      <div class="note-editor-slot"></div>
      <div class="note-attachments-bar">
        <span class="note-attach-label">📎 Anexos:</span>
        <div class="note-chips-container"></div>
        <div class="attach-dropdown-wrapper">
          <button type="button" class="btn-add-chip-trigger">+ Anexar Ficha</button>
          <div class="attach-popup-menu"></div>
        </div>
      </div>
    </div>
  `;

  const header = card.querySelector(".note-card-header");
  const titleInput = card.querySelector(".note-title-input");
  const saveBadge = card.querySelector(".note-save-badge");
  const deleteBtn = card.querySelector(".btn-delete-note");
  const editorSlot = card.querySelector(".note-editor-slot");
  const chipsContainer = card.querySelector(".note-chips-container");
  const triggerBtn = card.querySelector(".btn-add-chip-trigger");
  const popupMenu = card.querySelector(".attach-popup-menu");

  // Injeta o editor universal
  const editor = criarRichEditor({
    placeholder: "Registe pistas, ideias, regras ou tarefas...",
    valorInicial: nota.conteudo,
    onSalvar: (novoConteudo) => {
      saveBadge.textContent = "● Guardado";
      saveBadge.style.color = "#9ece6a";
      if (typeof onConteudoChange === "function") {
        onConteudoChange(novoConteudo);
      }
    }
  });
  editorSlot.appendChild(editor.elemento);

  // Renderização dos Chips de Anexos
  function renderizarChips() {
    chipsContainer.innerHTML = "";
    const anexos = Array.isArray(nota.anexos) ? nota.anexos : [];

    anexos.forEach((anexo, idx) => {
      const chip = document.createElement("div");
      chip.className = "note-chip";
      chip.innerHTML = `
        <span class="chip-text">${anexo.nome}</span>
        <span class="chip-remove" title="Desanexar">×</span>
      `;

      chip.addEventListener("click", (e) => {
        if (e.target.classList.contains("chip-remove")) {
          e.stopPropagation();
          anexos.splice(idx, 1);
          nota.anexos = anexos;
          renderizarChips();
          if (typeof onAnexosChange === "function") {
            onAnexosChange(anexos);
          }
          return;
        }

        if (typeof onNavegarFicha === "function") {
          onNavegarFicha(anexo.id);
        }
      });

      chipsContainer.appendChild(chip);
    });
  }

  // Preenche a lista de opções do popup
  function preencherPopupFichas() {
    popupMenu.innerHTML = "";
    const anexosAtuais = Array.isArray(nota.anexos) ? nota.anexos : [];
    const fichasFiltradas = fichasDisponiveis.filter(f => !anexosAtuais.some(a => a.id === f.id));

    if (!fichasFiltradas.length) {
      popupMenu.innerHTML = `<div class="popup-item-empty">Todas as fichas já anexadas.</div>`;
      return;
    }

    fichasFiltradas.forEach(f => {
      const itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.className = "popup-item-btn";
      itemBtn.innerHTML = `<span>👤 ${f.nome}</span>`;

      itemBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!Array.isArray(nota.anexos)) nota.anexos = [];
        nota.anexos.push({ id: f.id, nome: f.nome, aba: "fichas" });
        popupMenu.classList.remove("is-open");
        renderizarChips();
        if (typeof onAnexosChange === "function") {
          onAnexosChange(nota.anexos);
        }
      });

      popupMenu.appendChild(itemBtn);
    });
  }

  // Abertura/fechamento do popup
  triggerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const jaAberto = popupMenu.classList.contains("is-open");
    document.querySelectorAll(".attach-popup-menu.is-open").forEach(p => p.classList.remove("is-open"));

    if (!jaAberto) {
      preencherPopupFichas();
      popupMenu.classList.add("is-open");
    }
  });

  popupMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", (e) => {
    if (!popupMenu.contains(e.target) && e.target !== triggerBtn) {
      popupMenu.classList.remove("is-open");
    }
  });

  // Alternância de colapso
  header.addEventListener("click", (e) => {
    if (e.target === titleInput || e.target === deleteBtn || deleteBtn.contains(e.target)) return;
    const isCollapsed = card.classList.toggle("is-collapsed");
    if (typeof onToggle === "function") {
      onToggle(!isCollapsed);
    }
  });

  // Título da nota
  let debounceTimer;
  titleInput.addEventListener("input", (e) => {
    saveBadge.textContent = "● A guardar...";
    saveBadge.style.color = "#e0af68";
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const novoTitulo = e.target.value.trim() || "Sem Título";
      saveBadge.textContent = "● Guardado";
      saveBadge.style.color = "#9ece6a";
      if (typeof onTituloChange === "function") {
        onTituloChange(novoTitulo);
      }
    }, 400);
  });

  // Exclusão por duplo clique
  let resetDeleteTimer = null;
  deleteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (deleteBtn.classList.contains("confirm-delete")) {
      clearTimeout(resetDeleteTimer);
      deleteBtn.classList.remove("confirm-delete");
      deleteBtn.textContent = "✕";

      if (typeof onExcluir === "function") {
        onExcluir();
      }
      return;
    }

    deleteBtn.classList.add("confirm-delete");
    deleteBtn.textContent = "Excluir?";

    resetDeleteTimer = setTimeout(() => {
      deleteBtn.classList.remove("confirm-delete");
      deleteBtn.textContent = "✕";
    }, 3000);
  });

  renderizarChips();
  return card;
}