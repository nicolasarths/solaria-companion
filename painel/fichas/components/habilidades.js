export function renderHabilidadesCard(habilidades = []) {
  if (!habilidades.length) return "";

  let html = `<div><div class="section-label">Habilidades</div><div class="abilities-container">`;

  habilidades.forEach(h => {
    let pills = [];
    if (h.custo) pills.push(`<span class="pill-micro">⚡ Custo: ${h.custo}</span>`);
    if (h.tipo) pills.push(`<span class="pill-micro">🏷️ ${h.tipo}</span>`);
    if (h.distancia) pills.push(`<span class="pill-micro">🎯 Alcance: ${h.distancia}</span>`);
    if (h.dano) pills.push(`<span class="pill-micro">💥 Dano: ${h.dano}</span>`);
    if (h.area) pills.push(`<span class="pill-micro">🌐 Área: ${h.area}</span>`);

    html += `
      <div class="ability-card-view">
        <div class="ability-header-row">
          <span>${h.nome}</span>
        </div>
        ${pills.length ? `<div class="ability-pills-row">${pills.join("")}</div>` : ""}
        ${h.descricao ? `<div class="ability-desc-text">${h.descricao}</div>` : ""}
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}

export function renderHabilidadesForm(container, habilidadesIniciais = []) {
  const section = document.createElement("div");
  section.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
      <span class="section-label">Habilidades</span>
      <button type="button" id="btn-add-hab" class="btn-secondary" style="font-size:11px; padding:3px 8px;">+ Adicionar</button>
    </div>
    <div id="hab-list" style="display:flex; flex-direction:column; gap:6px; margin-top:4px;"></div>
  `;

  const list = section.querySelector("#hab-list");

  function criarCardHabilidade(h = {}) {
    const item = document.createElement("div");
    item.className = "edit-block-hab";

    item.innerHTML = `
      <div style="display:flex; gap:6px; margin-bottom:6px;">
        <input type="text" class="hab-nome" style="flex:1;" placeholder="Nome da Habilidade *" value="${h.nome || ""}">
        <button type="button" class="btn-del-hab" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:13px;">✖</button>
      </div>
      <div style="display:flex; gap:4px; margin-bottom:4px;">
        <input type="text" class="hab-custo" placeholder="Custo" value="${h.custo || ""}" style="width:33%;">
        <input type="text" class="hab-tipo" placeholder="Tipo" value="${h.tipo || ""}" style="width:33%;">
        <input type="text" class="hab-dist" placeholder="Distância" value="${h.distancia || ""}" style="width:33%;">
      </div>
      <div style="display:flex; gap:4px; margin-bottom:4px;">
        <input type="text" class="hab-dano" placeholder="Dano" value="${h.dano || ""}" style="width:50%;">
        <input type="text" class="hab-area" placeholder="Área" value="${h.area || ""}" style="width:50%;">
      </div>
      <textarea class="hab-desc" placeholder="Descrição da habilidade..." rows="2" style="width:100%;">${h.descricao || ""}</textarea>
    `;

    item.querySelector(".btn-del-hab").addEventListener("click", () => item.remove());
    list.appendChild(item);
  }

  habilidadesIniciais.forEach(h => criarCardHabilidade(h));
  section.querySelector("#btn-add-hab").addEventListener("click", () => criarCardHabilidade());

  container.appendChild(section);
}

export function getHabilidadesFormData(container) {
  const resultado = [];
  container.querySelectorAll("#hab-list .edit-block-hab").forEach(block => {
    const nome = block.querySelector(".hab-nome").value.trim();
    if (nome) {
      resultado.push({
        nome,
        custo: block.querySelector(".hab-custo").value.trim(),
        tipo: block.querySelector(".hab-tipo").value.trim(),
        distancia: block.querySelector(".hab-dist").value.trim(),
        dano: block.querySelector(".hab-dano").value.trim(),
        area: block.querySelector(".hab-area").value.trim(),
        descricao: block.querySelector(".hab-desc").value.trim()
      });
    }
  });
  return resultado;
}