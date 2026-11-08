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
  wrapper.innerHTML = `
    <div class="section-label" style="margin-top:10px;">Histórico</div>
    <div style="display:flex; gap:4px; margin-bottom:4px;">
      <button type="button" class="tool-btn" data-cmd="bold"><b>B</b></button>
      <button type="button" class="tool-btn" data-cmd="italic"><i>I</i></button>
      <button type="button" class="tool-btn" data-cmd="insertUnorderedList">• Lista</button>
    </div>
    <div id="f-historico" class="editor-history" contenteditable="true">${historico}</div>
  `;

  wrapper.querySelectorAll(".tool-btn").forEach(btn => {
    btn.addEventListener("click", () => document.execCommand(btn.dataset.cmd, false, null));
  });

  container.appendChild(wrapper);
}

export function getHistoricoFormData(container) {
  return container.querySelector("#f-historico")?.innerHTML || "";
}