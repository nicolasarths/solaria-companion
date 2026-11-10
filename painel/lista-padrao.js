/**
 * Renderizador de entidades para abas estáticas (sem custom JS)
 */
export function renderizarListaPadrao(section, pasta, registros = [], Estado) {
  section.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "default-list-layout";

  const buscaInput = document.createElement("input");
  buscaInput.type = "text";
  buscaInput.placeholder = `Buscar em ${pasta}...`;
  buscaInput.className = "search-input";

  const containerCards = document.createElement("div");
  containerCards.className = "cards-list";
  containerCards.style.display = "flex";
  containerCards.style.flexDirection = "column";
  containerCards.style.gap = "8px";

  wrapper.appendChild(buscaInput);
  wrapper.appendChild(containerCards);
  section.appendChild(wrapper);

  function desenhar() {
    containerCards.innerHTML = "";
    const termo = buscaInput.value.toLowerCase().trim();

    const filtrados = registros.filter((item) => {
      const visivel = Estado.role === "GM" || item.visivelPlayer !== false;
      const matchNome = (item.nome || "").toLowerCase().includes(termo);
      return visivel && matchNome;
    });

    filtrados.forEach((item) => {
      const card = document.createElement("div");
      card.className = `card ${item.visivelPlayer === false ? "card-gm-only" : ""}`;
      card.id = `card-${item.id}`;

      const header = document.createElement("div");
      header.className = "card-header";
      header.innerHTML = `
        <span>${item.nome} ${item.visivelPlayer === false ? "🔒" : ""}</span>
        <span class="card-tag">${item.tag || pasta}</span>
      `;

      const body = document.createElement("div");
      body.className = "card-body";
      body.innerHTML = `
        <div>${item.desc || ""}</div>
        ${Estado.role === "GM" && item.segredoGM ? `<div class="gm-secret"><strong>Segredo GM:</strong> ${item.segredoGM}</div>` : ""}
      `;

      card.appendChild(header);
      card.appendChild(body);
      card.addEventListener("click", () => card.classList.toggle("open"));
      containerCards.appendChild(card);
    });
  }

  buscaInput.addEventListener("input", desenhar);
  desenhar();
}