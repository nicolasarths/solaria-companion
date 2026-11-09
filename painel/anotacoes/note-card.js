import { criarRichEditor } from "../../ui/rich-editor.js";

function obterIconePermissaoNota(nota) {
  if (nota.visivelPlayer === false) return "🔒";
  if (!nota.editavelPlayer) return "👁️";
  return "✍️";
}

function obterTituloPermissaoNota(nota) {
  if (nota.visivelPlayer === false) return "Status: Oculto para jogadores (Clique para liberar Leitura)";
  if (!nota.editavelPlayer) return "Status: Jogador pode Ver apenas (Clique para liberar Edição)";
  return "Status: Jogador pode Ver e Editar (Clique para Ocultar)";
}

export function criarCardNota({
  nota,
  role,
  aberta,
  fichasDisponiveis = [],
  onToggle,
  onTituloChange,
  onConteudoChange,
  onAnexosChange,
  onVisibilidadeChange,
  onExcluir,
  onNavegarFicha
}) {
  const isGM = role === "GM";
  const isVisivel = nota.visivelPlayer !== false;
  const isEditavel = isGM || nota.editavelPlayer === true;

  const card = document.createElement("div");
  card.className = `note-card ${aberta ? "" : "is-collapsed"}`;
  card.id = `note-card-${nota.id}`;

  card.innerHTML = `
    <div class="note-card-header">
      <button type="button" class="btn-collapse-arrow" title="Colapsar / Expandir">▼</button>
      <input type="text" class="note-title-input" value="${nota.titulo || "Sem Título"}" placeholder="Título da anotação..." ${!isEditavel ? "readonly" : ""}>
      
      ${isGM ? `
        <button type="button" class="btn-toggle-permissao-nota" title="${obterTituloPermissaoNota(nota)}" style="background:transparent; border:none; cursor:pointer; font-size:12px; margin:0 4px; padding:2px;">
          ${obterIconePermissaoNota(nota)}
        </button>
      ` : (nota.editavelPlayer ? `<span title="Você pode editar esta anotação" style="font-size:11px; margin:0 4px;">✍️</span>` : "")}
      
      <span class="note-save-badge">${isEditavel ? "● Guardado" : ""}</span>
      ${isGM ? `<button type="button" class="btn-delete-note" title="Clique duas vezes para excluir">✕</button>` : ""}
    </div>
    <div class="note-card-body">
      <div class="note-editor-slot"></div>
      <div class="note-attachments-bar">
        <span class="note-attach-label">📎 Anexos:</span>
        <div class="note-chips-container"></div>
        ${isEditavel ? `
          <div class="attach-dropdown-wrapper">
            <button type="button" class="btn-add-chip-trigger">+ Anexar Ficha</button>
            <div class="attach-popup-menu"></div>
          </div>
        ` : ""}
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
  const btnPermissao = card.querySelector(".btn-toggle-permissao-nota");

  const editor = criarRichEditor({
    placeholder: isEditavel ? "Registe pistas, ideias, regras ou tarefas..." : "Anotação em modo leitura...",
    valorInicial: nota.conteudo,
    onSalvar: (novoConteudo) => {
      if (!isEditavel) return;
      saveBadge.textContent = "● Guardado";
      saveBadge.style.color = "#9ece6a";
      if (typeof onConteudoChange === "function") {
        onConteudoChange(novoConteudo);
      }
    }
  });
  editorSlot.appendChild(editor.elemento);

  if (!isEditavel) {
    const editorBody = editorSlot.querySelector("[contenteditable]");
    if (editorBody) editorBody.setAttribute("contenteditable", "false");
    const toolbar = editorSlot.querySelector(".solaria-editor-toolbar");
    if (toolbar) toolbar.style.display = "none";
  }

  function renderizarChips() {
    chipsContainer.innerHTML = "";
    const anexos = Array.isArray(nota.anexos) ? nota.anexos : [];

    anexos.forEach((anexo, idx) => {
      const chip = document.createElement("div");
      chip.className = "note-chip";
      chip.innerHTML = `
        <span class="chip-text">${anexo.nome}</span>
        ${isEditavel ? `<span class="chip-remove" title="Desanexar">×</span>` : ""}
      `;

      chip.addEventListener("click", (e) => {
        if (isEditavel && e.target.classList.contains("chip-remove")) {
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

  function preencherPopupFichas() {
    if (!popupMenu) return;
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

  if (isEditavel && triggerBtn) {
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

    popupMenu.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", (e) => {
      if (!popupMenu.contains(e.target) && e.target !== triggerBtn) {
        popupMenu.classList.remove("is-open");
      }
    });
  }

  header.addEventListener("click", (e) => {
    if (
      e.target === titleInput || 
      e.target === deleteBtn || 
      deleteBtn?.contains(e.target) || 
      e.target.closest(".btn-toggle-permissao-nota")
    ) return;
    
    const isCollapsed = card.classList.toggle("is-collapsed");
    if (typeof onToggle === "function") onToggle(!isCollapsed);
  });

  if (isGM) {
    btnPermissao?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      let novasPermissoes = {};
      if (nota.visivelPlayer === false) {
        novasPermissoes = { visivelPlayer: true, editavelPlayer: false };
      } else if (!nota.editavelPlayer) {
        novasPermissoes = { visivelPlayer: true, editavelPlayer: true };
      } else {
        novasPermissoes = { visivelPlayer: false, editavelPlayer: false };
      }

      if (typeof onVisibilidadeChange === "function") {
        onVisibilidadeChange(novasPermissoes);
      }
    });

    let resetDeleteTimer = null;
    deleteBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (deleteBtn.classList.contains("confirm-delete")) {
        clearTimeout(resetDeleteTimer);
        deleteBtn.classList.remove("confirm-delete");
        deleteBtn.textContent = "✕";
        if (typeof onExcluir === "function") onExcluir();
        return;
      }
      deleteBtn.classList.add("confirm-delete");
      deleteBtn.textContent = "Excluir?";
      resetDeleteTimer = setTimeout(() => {
        deleteBtn.classList.remove("confirm-delete");
        deleteBtn.textContent = "✕";
      }, 3000);
    });
  }

  if (isEditavel) {
    let debounceTimer;
    titleInput.addEventListener("input", (e) => {
      saveBadge.textContent = "● A guardar...";
      saveBadge.style.color = "#e0af68";
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const novoTitulo = e.target.value.trim() || "Sem Título";
        saveBadge.textContent = "● Guardado";
        saveBadge.style.color = "#9ece6a";
        if (typeof onTituloChange === "function") onTituloChange(novoTitulo);
      }, 400);
    });
  }

  renderizarChips();
  return card;
}