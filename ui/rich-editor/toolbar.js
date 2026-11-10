/**
 * Barra de Ferramentas do Solaria Editor
 * Responsabilidade: Criar os botões de ação e despachar comandos de formatação.
 */

const ACOES_FORMATACAO = [
  { rotulo: "B", tagInterna: "b", cmd: "bold", dica: "Negrito (Ctrl+B)" },
  { rotulo: "I", tagInterna: "i", cmd: "italic", dica: "Itálico (Ctrl+I)" },
  { rotulo: "U", tagInterna: "u", cmd: "underline", dica: "Sublinhado (Ctrl+U)" },
  { rotulo: "S", tagInterna: "s", cmd: "strikeThrough", dica: "Tachado" }
];

/**
 * Monta o nó da barra de ferramentas com botões configurados
 * @param {Object} callbacks - Funções chamadas pelas ações especiais
 * @param {Function} callbacks.aoFormatarTexto - Executa document.execCommand
 * @param {Function} callbacks.aoInserirLista - Insere lista com marcadores
 * @param {Function} callbacks.aoInserirTodo - Insere nó de checklist
 * @returns {HTMLDivElement} Elemento .solaria-editor-toolbar
 */
export function criarBarraFerramentas({ aoFormatarTexto, aoInserirLista, aoInserirTodo }) {
  const toolbar = document.createElement("div");
  toolbar.className = "solaria-editor-toolbar";

  // 1. Botões de comando direto (B, I, U, S)
  ACOES_FORMATACAO.forEach(({ rotulo, tagInterna, cmd, dica }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ed-btn";
    btn.title = dica;

    const rotuloEl = document.createElement(tagInterna);
    rotuloEl.textContent = rotulo;
    btn.appendChild(rotuloEl);

    btn.addEventListener("mousedown", (e) => {
      e.preventDefault(); // Impede perda de seleção no editor
      if (typeof aoFormatarTexto === "function") aoFormatarTexto(cmd);
    });

    toolbar.appendChild(btn);
  });

  // Divisor visual
  const divisor = document.createElement("div");
  divisor.className = "ed-divider";
  toolbar.appendChild(divisor);

  // 2. Botão Lista com Marcadores
  const btnLista = document.createElement("button");
  btnLista.type = "button";
  btnLista.className = "ed-btn";
  btnLista.textContent = "• Lista";
  btnLista.title = "Lista com Marcadores (* + Espaço)";
  btnLista.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (typeof aoInserirLista === "function") aoInserirLista();
  });
  toolbar.appendChild(btnLista);

  // 3. Botão Checklist
  const btnTodo = document.createElement("button");
  btnTodo.type = "button";
  btnTodo.className = "ed-btn";
  btnTodo.textContent = "☑ Tarefa";
  btnTodo.title = "Checklist ([] + Espaço)";
  btnTodo.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (typeof aoInserirTodo === "function") aoInserirTodo();
  });
  toolbar.appendChild(btnTodo);

  return toolbar;
}