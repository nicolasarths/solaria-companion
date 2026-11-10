/**
 * Gerenciador de Elementos de Checklist do Solaria Editor
 * Responsabilidade: Criar nós de checklist no DOM e sincronizar estados sem HTML em string.
 */

/**
 * Cria programaticamente um nó de item de checklist via DOM puro
 * @param {string} textoInicial - Texto inicial do span
 * @returns {HTMLDivElement} Elemento .todo-item pronto
 */
export function criarElementoTodo(textoInicial = "") {
  const item = document.createElement("div");
  item.className = "todo-item";

  const check = document.createElement("input");
  check.type = "checkbox";
  check.className = "todo-check";
  // IMPORTANTE: contentEditable false impede que o cursor quebre a checkbox
  check.setAttribute("contenteditable", "false");

  const textSpan = document.createElement("span");
  textSpan.className = "todo-text";
  textSpan.textContent = textoInicial || "\u00a0"; // Espaço não-quebrável para manter foco

  item.appendChild(check);
  item.appendChild(textSpan);

  return item;
}

/**
 * Insere um novo item de tarefa na posição atual do cursor do editor
 * @param {HTMLDivElement} editorBody - Elemento com contenteditable
 * @param {Function} aoModificar - Callback para disparar debounce de salvamento
 */
export function inserirItemTodoNoCursor(editorBody, aoModificar) {
  editorBody.focus();

  const novoItem = criarElementoTodo("");
  const selection = window.getSelection();

  if (!selection || !selection.rangeCount) {
    editorBody.appendChild(novoItem);
  } else {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(novoItem);

    // Reposiciona o cursor dentro do span de texto da nova tarefa
    const spanTexto = novoItem.querySelector(".todo-text");
    if (spanTexto) {
      const novoRange = document.createRange();
      novoRange.selectNodeContents(spanTexto);
      novoRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(novoRange);
    }
  }

  if (typeof aoModificar === "function") aoModificar();
}

/**
 * Alterna a marcação visual e o atributo checked do elemento
 * @param {HTMLInputElement} checkbox - Elemento input checkbox clicado
 * @param {Function} aoModificar - Callback de salvamento
 */
export function alternarStatusCheck(checkbox, aoModificar) {
  const itemPai = checkbox.closest(".todo-item");
  if (!itemPai) return;

  if (checkbox.checked) {
    itemPai.classList.add("completed");
    checkbox.setAttribute("checked", "checked");
  } else {
    itemPai.classList.remove("completed");
    checkbox.removeAttribute("checked");
  }

  if (typeof aoModificar === "function") aoModificar();
}

/**
 * Garante que checkboxes preexistentes no HTML salvo mantenham contenteditable="false" e classes corretas
 * @param {HTMLDivElement} editorBody - Container do editor
 */
export function inicializarCheckboxesExistentes(editorBody) {
  editorBody.querySelectorAll(".todo-check").forEach((cb) => {
    cb.setAttribute("contenteditable", "false");
    const itemPai = cb.closest(".todo-item");
    if (cb.hasAttribute("checked") || itemPai?.classList.contains("completed")) {
      cb.checked = true;
      itemPai?.classList.add("completed");
    }
  });
}