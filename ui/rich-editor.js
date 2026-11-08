/**
 * Editor Universal de Texto Formatável (Solaria)
 * Suporta toolbar, Markdown shortcuts (* + Espaço, [] + Espaço) e checklists interativos.
 */
export function criarRichEditor({ placeholder = "Digite seu texto...", valorInicial = "", onSalvar }) {
  // Injeta estilos essenciais do editor caso não estejam presentes
  if (!document.getElementById("css-rich-editor-shared")) {
    const style = document.createElement("style");
    style.id = "css-rich-editor-shared";
    style.textContent = `
      .solaria-editor-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 140px;
        background: #16161e;
        border: 1px solid #2f354d;
        border-radius: 8px;
        overflow: hidden;
      }
      .solaria-editor-toolbar {
        display: flex;
        gap: 2px;
        padding: 5px 8px;
        background: #13141c;
        border-bottom: 1px solid #24283b;
        align-items: center;
      }
      .ed-btn {
        background: transparent;
        border: none;
        color: #a9b1d6;
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.15s, color 0.15s;
      }
      .ed-btn:hover { background: #24283b; color: #fff; }
      .ed-divider { width: 1px; height: 14px; background: #2f354d; margin: 0 4px; }
      .solaria-editor-body {
        flex: 1;
        padding: 10px 12px;
        color: #c0caf5;
        font-size: 13px;
        line-height: 1.6;
        outline: none;
        overflow-y: auto;
      }
      .solaria-editor-body[contenteditable]:empty::before {
        content: attr(data-placeholder);
        color: #565f89;
        pointer-events: none;
      }
      .solaria-editor-body ul {
        margin: 4px 0;
        padding-left: 20px;
      }
      .todo-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 4px 0;
        line-height: 1.4;
      }
      .todo-check {
        cursor: pointer;
        margin-top: 3px;
        accent-color: #7aa2f7;
      }
      .todo-text {
        flex: 1;
        outline: none;
      }
      .todo-item.completed,
      .todo-item.completed .todo-text {
        text-decoration: line-through;
        color: #565f89 !important;
      }
    `;
    document.head.appendChild(style);
  }

  const container = document.createElement("div");
  container.className = "solaria-editor-container";

  container.innerHTML = `
    <div class="solaria-editor-toolbar">
      <button type="button" class="ed-btn" data-cmd="bold" title="Negrito (Ctrl+B)"><b>B</b></button>
      <button type="button" class="ed-btn" data-cmd="italic" title="Itálico (Ctrl+I)"><i>I</i></button>
      <button type="button" class="ed-btn" data-cmd="underline" title="Sublinhado (Ctrl+U)"><u>U</u></button>
      <button type="button" class="ed-btn" data-cmd="strikeThrough" title="Tachado"><s>S</s></button>
      <div class="ed-divider"></div>
      <button type="button" class="ed-btn" data-action="list" title="Lista com Marcadores (* + Espaço)">• Lista</button>
      <button type="button" class="ed-btn" data-action="todo" title="Checklist ([] + Espaço)">☑ Tarefa</button>
    </div>
    <div class="solaria-editor-body" contenteditable="true" data-placeholder="${placeholder}"></div>
  `;

  const body = container.querySelector(".solaria-editor-body");
  body.innerHTML = valorInicial || "";

  // Sincroniza estado de checkboxes carregados do HTML salvo
  body.querySelectorAll(".todo-check").forEach((cb) => {
    cb.setAttribute("contenteditable", "false");
    if (cb.hasAttribute("checked") || cb.closest(".todo-item")?.classList.contains("completed")) {
      cb.checked = true;
      cb.closest(".todo-item")?.classList.add("completed");
    }
  });

  let debounceTimer;
  function notificarAlteracao() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (typeof onSalvar === "function") {
        onSalvar(body.innerHTML);
      }
    }, 400);
  }

  function inserirItemTodo() {
    body.focus();
    const tempId = "todo_" + Date.now();
    const todoHtml = `<div class="todo-item" id="${tempId}"><input type="checkbox" class="todo-check" contenteditable="false"><span class="todo-text">&nbsp;</span></div>`;
    document.execCommand("insertHTML", false, todoHtml);

    const el = body.querySelector(`#${tempId}`);
    if (el) {
      el.removeAttribute("id");
      const span = el.querySelector(".todo-text");
      if (span) {
        const sel = window.getSelection();
        const r = document.createRange();
        r.selectNodeContents(span);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
    notificarAlteracao();
  }

  // Botões de Formatação Simples
  container.querySelectorAll(".ed-btn[data-cmd]").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, null);
      notificarAlteracao();
    });
  });

  // Botões da Barra
  container.querySelector('[data-action="list"]').addEventListener("mousedown", (e) => {
    e.preventDefault();
    document.execCommand("insertUnorderedList", false, null);
    notificarAlteracao();
  });

  container.querySelector('[data-action="todo"]').addEventListener("mousedown", (e) => {
    e.preventDefault();
    inserirItemTodo();
  });

  // Interceptação de Atalhos no Teclado
  body.addEventListener("keydown", (e) => {
    // 1. Atalhos Markdown ao pressionar Espaço (* + Espaço ou [] + Espaço)
    if (e.key === " " || e.code === "Space") {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const node = range.startContainer;

      if (node.nodeType === Node.TEXT_NODE) {
        const textBefore = node.textContent.slice(0, range.startOffset);
        const trimmed = textBefore.trim();

        // Lista (* ou -)
        if (trimmed === "*" || trimmed === "-") {
          e.preventDefault();
          const startIdx = textBefore.lastIndexOf(trimmed);
          const delRange = document.createRange();
          delRange.setStart(node, startIdx);
          delRange.setEnd(node, range.startOffset);
          selection.removeAllRanges();
          selection.addRange(delRange);
          document.execCommand("delete");
          document.execCommand("insertUnorderedList");
          notificarAlteracao();
          return;
        }

        // Checklist ([] ou [ ])
        if (trimmed === "[]" || trimmed === "[ ]") {
          e.preventDefault();
          const startIdx = textBefore.lastIndexOf(trimmed);
          const delRange = document.createRange();
          delRange.setStart(node, startIdx);
          delRange.setEnd(node, range.startOffset);
          selection.removeAllRanges();
          selection.addRange(delRange);
          document.execCommand("delete");
          inserirItemTodo();
          return;
        }
      }
    }

    // 2. Comportamento do Enter dentro de itens de Checklist
    if (e.key === "Enter") {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const targetElement = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer.parentElement;

      const currentTodo = targetElement?.closest(".todo-item");
      if (currentTodo) {
        const textSpan = currentTodo.querySelector(".todo-text");
        const textoAtual = textSpan ? textSpan.textContent.replace(/\u00a0/g, "").trim() : "";

        // Se deu Enter numa linha de tarefa vazia, sai do modo todo
        if (!textoAtual) {
          e.preventDefault();
          currentTodo.remove();
          document.execCommand("insertParagraph");
          notificarAlteracao();
          return;
        }

        // Se tinha texto, cria outro item de checklist logo abaixo
        e.preventDefault();
        inserirItemTodo();
      }
    }
  });

  // Alternar Checkbox com Efeito Riscado e Persistência no HTML
  function alternarCheck(cb) {
    const item = cb.closest(".todo-item");
    if (!item) return;

    if (cb.checked) {
      item.classList.add("completed");
      cb.setAttribute("checked", "checked");
    } else {
      item.classList.remove("completed");
      cb.removeAttribute("checked");
    }
    notificarAlteracao();
  }

  body.addEventListener("change", (e) => {
    if (e.target.classList.contains("todo-check")) {
      alternarCheck(e.target);
    }
  });

  body.addEventListener("click", (e) => {
    if (e.target.classList.contains("todo-check")) {
      alternarCheck(e.target);
    }
  });

  body.addEventListener("input", notificarAlteracao);

  return {
    elemento: container,
    obterConteudo: () => body.innerHTML,
    definirConteudo: (html) => {
      body.innerHTML = html || "";
    },
    focar: () => body.focus()
  };
}