import { inserirItemTodoNoCursor } from "./checklist.js";

/**
 * Gerenciador de Atalhos de Teclado e Markdown
 * Responsabilidade: Tratar atalhos inline (* + Espaço, [] + Espaço) e quebras de linha com Enter.
 */

/**
 * Conecta os ouvintes de atalhos ao corpo do editor
 * @param {HTMLDivElement} editorBody - Elemento com contenteditable
 * @param {Function} aoModificar - Callback de salvamento
 */
export function configurarAtalhosTeclado(editorBody, aoModificar) {
  editorBody.addEventListener("keydown", (e) => {
    // Atalho 1: Markdown ao pressionar Espaço (* ou [])
    if (e.key === " " || e.code === "Space") {
      tratarEspacoMarkdown(e, editorBody, aoModificar);
      return;
    }

    // Atalho 2: Comportamento da tecla Enter dentro de checklists
    if (e.key === "Enter") {
      tratarEnterChecklist(e, editorBody, aoModificar);
    }
  });
}

function tratarEspacoMarkdown(e, editorBody, aoModificar) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const node = range.startContainer;

  if (node.nodeType !== Node.TEXT_NODE) return;

  const textoAnterior = node.textContent.slice(0, range.startOffset);
  const comando = textoAnterior.trim();

  // Lista com Marcadores (* ou -)
  if (comando === "*" || comando === "-") {
    e.preventDefault();
    const indiceInicio = textoAnterior.lastIndexOf(comando);
    const rangeRemocao = document.createRange();
    rangeRemocao.setStart(node, indiceInicio);
    rangeRemocao.setEnd(node, range.startOffset);

    selection.removeAllRanges();
    selection.addRange(rangeRemocao);
    document.execCommand("delete");
    document.execCommand("insertUnorderedList");

    if (typeof aoModificar === "function") aoModificar();
    return;
  }

  // Checklist ([] ou [ ])
  if (comando === "[]" || comando === "[ ]") {
    e.preventDefault();
    const indiceInicio = textoAnterior.lastIndexOf(comando);
    const rangeRemocao = document.createRange();
    rangeRemocao.setStart(node, indiceInicio);
    rangeRemocao.setEnd(node, range.startOffset);

    selection.removeAllRanges();
    selection.addRange(rangeRemocao);
    document.execCommand("delete");

    inserirItemTodoNoCursor(editorBody, aoModificar);
  }
}

function tratarEnterChecklist(e, editorBody, aoModificar) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const elementoAlvo = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer
    : range.startContainer.parentElement;

  const todoAtual = elementoAlvo?.closest(".todo-item");
  if (!todoAtual) return;

  const spanTexto = todoAtual.querySelector(".todo-text");
  const conteudoTexto = spanTexto ? spanTexto.textContent.replace(/\u00a0/g, "").trim() : "";

  // Se deu Enter em item vazio, encerra a lista de tarefas e abre parágrafo comum
  if (!conteudoTexto) {
    e.preventDefault();
    todoAtual.remove();
    document.execCommand("insertParagraph");
    if (typeof aoModificar === "function") aoModificar();
    return;
  }

  // Se tem texto, quebra criando outro item de checklist logo abaixo
  e.preventDefault();
  inserirItemTodoNoCursor(editorBody, aoModificar);
}