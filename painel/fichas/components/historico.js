import { criarRichEditor } from "../../../ui/rich-editor/rich-editor.js";

export function renderHistoricoCard(historico) {
  if (!historico || historico.trim() === "" || historico === "<br>") return "";
  return `
    <div>
      <div class="section-label">Histórico</div>
      <div class="history-box">${historico}</div>
    </div>
  `;
}

export function renderHistoricoForm(container, historico = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "historico-form-wrapper";
  wrapper.innerHTML = `
    <div class="section-label" style="margin-top:10px;">Histórico</div>
    <div id="editor-slot-historico"></div>
  `;

  const editorSlot = wrapper.querySelector("#editor-slot-historico");

  // Instancia o editor rico universal com suporte a checklists, atalhos markdown e barra completa
  const editor = criarRichEditor({
    placeholder: "Descreva o histórico, anotações ou progresso da entidade...",
    valorInicial: historico,
    onSalvar: () => {} // Salvamento tratado no botão de guardar geral da ficha
  });

  editorSlot.appendChild(editor.elemento);
  container.appendChild(wrapper);

  // Armazena referência para coleta de dados no formulário
  wrapper._richEditorInstance = editor;
}

export function getHistoricoFormData(container) {
  const wrapper = container.querySelector(".historico-form-wrapper");
  if (wrapper && wrapper._richEditorInstance) {
    return wrapper._richEditorInstance.obterConteudo();
  }
  return container.querySelector("#f-historico")?.innerHTML || "";
}