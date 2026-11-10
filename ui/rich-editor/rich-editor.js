import { criarBarraFerramentas } from "./toolbar.js";
import { 
  inserirItemTodoNoCursor, 
  alternarStatusCheck, 
  inicializarCheckboxesExistentes 
} from "./checklist.js";
import { configurarAtalhosTeclado } from "./shortcuts.js";

/**
 * Ponto Central de Montagem do Solaria Rich Editor
 * Responsabilidade: Orquestrar toolbar, área editável e ciclo de vida do componente.
 */
export function criarRichEditor({ placeholder = "Digite seu texto...", valorInicial = "", onSalvar }) {
  // Injeta link da folha de estilos se ainda não presente no documento
  if (!document.getElementById("css-rich-editor-shared")) {
    const link = document.createElement("link");
    link.id = "css-rich-editor-shared";
    link.rel = "stylesheet";
    link.href = new URL("./rich-editor.css", import.meta.url).href;
    document.head.appendChild(link);
  }

  const container = document.createElement("div");
  container.className = "solaria-editor-container";

  const editorBody = document.createElement("div");
  editorBody.className = "solaria-editor-body";
  editorBody.setAttribute("contenteditable", "true");
  editorBody.setAttribute("data-placeholder", placeholder);
  editorBody.innerHTML = valorInicial || "";

  // Inicializa checkboxes persistidas
  inicializarCheckboxesExistentes(editorBody);

  // Debounce para persistência suave
  let timerSalvar = null;
  function notificarAlteracao() {
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(() => {
      if (typeof onSalvar === "function") {
        onSalvar(editorBody.innerHTML);
      }
    }, 400);
  }

  // Montagem da barra de ferramentas
  const toolbar = criarBarraFerramentas({
    aoFormatarTexto: (cmd) => {
      document.execCommand(cmd, false, null);
      notificarAlteracao();
    },
    aoInserirLista: () => {
      document.execCommand("insertUnorderedList", false, null);
      notificarAlteracao();
    },
    aoInserirTodo: () => {
      inserirItemTodoNoCursor(editorBody, notificarAlteracao);
    }
  });

  // Conexão de atalhos de teclado (Markdown e Enter)
  configurarAtalhosTeclado(editorBody, notificarAlteracao);

  // Eventos de clique e alteração nas checkboxes
  const tratarCliqueCheckbox = (e) => {
    if (e.target.classList.contains("todo-check")) {
      alternarStatusCheck(e.target, notificarAlteracao);
    }
  };

  editorBody.addEventListener("change", tratarCliqueCheckbox);
  editorBody.addEventListener("click", tratarCliqueCheckbox);
  editorBody.addEventListener("input", notificarAlteracao);

  // Acoplamento final
  container.appendChild(toolbar);
  container.appendChild(editorBody);

  return {
    elemento: container,
    obterConteudo: () => editorBody.innerHTML,
    definirConteudo: (html) => {
      editorBody.innerHTML = html || "";
      inicializarCheckboxesExistentes(editorBody);
    },
    focar: () => editorBody.focus()
  };
}