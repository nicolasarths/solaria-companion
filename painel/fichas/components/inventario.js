export function renderInventarioCard(inventario = []) {
  if (!inventario.length) return "";

  let html = `<div><div class="section-label">Inventário</div><div class="inventory-container">`;

  inventario.forEach(iv => {
    html += `
      <div class="inv-entry">
        <span class="inv-qty">${iv.qt || 1}x</span>
        <span class="inv-name">${iv.item}</span>
        ${iv.peso ? `<span class="inv-weight">(${iv.peso})</span>` : ""}
        ${iv.desc ? `<span class="inv-desc">— ${iv.desc}</span>` : ""}
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}

export function renderInventarioForm(container, inventarioInicial = []) {
  const section = document.createElement("div");
  section.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
      <span class="section-label">Inventário</span>
      <button type="button" id="btn-add-inv" class="btn-secondary" style="font-size:11px; padding:3px 8px;">+ Item</button>
    </div>
    <div id="inv-list" style="display:flex; flex-direction:column; gap:4px; margin-top:4px;"></div>
  `;

  const list = section.querySelector("#inv-list");

  function criarLinha(iv = {}) {
    const row = document.createElement("div");
    row.className = "edit-block-inv";
    row.style.display = "flex";
    row.style.gap = "4px";
    row.style.alignItems = "center";
    row.innerHTML = `
      <input type="text" class="iv-qt" placeholder="Qtd" value="${iv.qt || 1}" style="width:45px; text-align:center;">
      <input type="text" class="iv-item" placeholder="Item *" value="${iv.item || ""}" style="flex:1;">
      <input type="text" class="iv-peso" placeholder="Peso" value="${iv.peso || ""}" style="width:55px;">
      <input type="text" class="iv-desc" placeholder="Descrição" value="${iv.desc || ""}" style="flex:1;">
      <button type="button" class="btn-del-inv" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:13px;">✖</button>
    `;
    row.querySelector(".btn-del-inv").addEventListener("click", () => row.remove());
    list.appendChild(row);
  }

  inventarioInicial.forEach(iv => criarLinha(iv));
  section.querySelector("#btn-add-inv").addEventListener("click", () => criarLinha());

  container.appendChild(section);
}

export function getInventarioFormData(container) {
  const resultado = [];
  container.querySelectorAll("#inv-list .edit-block-inv").forEach(row => {
    const item = row.querySelector(".iv-item").value.trim();
    if (item) {
      resultado.push({
        qt: row.querySelector(".iv-qt").value.trim() || "1",
        item,
        peso: row.querySelector(".iv-peso").value.trim(),
        desc: row.querySelector(".iv-desc").value.trim()
      });
    }
  });
  return resultado;
}