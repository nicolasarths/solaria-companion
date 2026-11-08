/**
 * Componente de Referências Rápidas Anexadas ao Diário
 */
export function criarSecaoAnexos(Estado) {
  let anexos = JSON.parse(localStorage.getItem("solaria_anexos") || "[]");

  const secao = document.createElement("div");
  secao.className = "attachments-card";
  secao.innerHTML = `
    <div class="attachments-label">
      <span>📎 Referências Rápidas Anexadas</span>
    </div>
    <div class="attachments-controls">
      <select id="select-entity" class="custom-select"></select>
      <button type="button" id="btn-add-ref" class="btn-attach-action">+ Anexar</button>
    </div>
    <div id="chips-container" class="chips-flow"></div>
  `;

  const select = secao.querySelector("#select-entity");
  const chipsContainer = secao.querySelector("#chips-container");

  function popularOpcoes() {
    select.innerHTML = "";

    const fichasCustom = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    fichasCustom
      .filter(f => Estado.role === "GM" || f.visivelPlayer)
      .forEach(f => {
        const opt = document.createElement("option");
        opt.value = JSON.stringify({ id: f.id, nome: f.nome, aba: "fichas" });
        opt.textContent = `[FICHA] ${f.nome}`;
        select.appendChild(opt);
      });

    Object.entries(Estado.modulos || {}).forEach(([aba, dados]) => {
      if (aba === "anotacoes" || aba === "fichas") return;
      (dados.registros || [])
        .filter(i => Estado.role === "GM" || i.visivelPlayer)
        .forEach(item => {
          const opt = document.createElement("option");
          opt.value = JSON.stringify({ id: item.id, nome: item.nome, aba });
          opt.textContent = `[${aba.toUpperCase()}] ${item.nome}`;
          select.appendChild(opt);
        });
    });
  }

  function renderizarChips() {
    chipsContainer.innerHTML = "";
    if (!anexos.length) {
      chipsContainer.innerHTML = `<span style="font-size:11px; color:#565f89; padding:2px;">Nenhum atalho fixado.</span>`;
      return;
    }

    anexos.forEach((anexo, idx) => {
      const chip = document.createElement("div");
      chip.className = "chip-badge";

      let catClass = "cat-default";
      if (anexo.aba === "fichas") catClass = "cat-fichas";
      else if (anexo.aba === "itens") catClass = "cat-itens";
      else if (anexo.aba === "locais") catClass = "cat-locais";

      chip.innerHTML = `
        <span class="chip-tag-category ${catClass}">${anexo.aba}</span>
        <span>${anexo.nome}</span>
        <span class="chip-close" data-idx="${idx}" title="Remover">×</span>
      `;

      chip.addEventListener("click", (e) => {
        if (e.target.classList.contains("chip-close")) {
          anexos.splice(idx, 1);
          localStorage.setItem("solaria_anexos", JSON.stringify(anexos));
          renderizarChips();
          return;
        }
        if (typeof Estado.irParaCard === "function") {
          Estado.irParaCard(anexo.aba, anexo.id);
        }
      });

      chipsContainer.appendChild(chip);
    });
  }

  secao.querySelector("#btn-add-ref").addEventListener("click", () => {
    if (!select.value) return;
    const item = JSON.parse(select.value);
    if (!anexos.some(a => a.id === item.id)) {
      anexos.push(item);
      localStorage.setItem("solaria_anexos", JSON.stringify(anexos));
      renderizarChips();
    }
  });

  popularOpcoes();
  renderizarChips();

  return secao;
}