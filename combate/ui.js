export function renderizarCombate(container, store) {
  const badgeRodada = document.getElementById("round-badge");
  if (badgeRodada) {
    badgeRodada.textContent = `Turno ${store.rodada}`;
  }

  // Se o usuário estiver digitando num input de iniciativa, evita destruir o DOM sob os dedos dele
  const elAtivo = document.activeElement;
  if (elAtivo && elAtivo.classList.contains("init-input")) {
    return;
  }

  container.innerHTML = "";

  if (!store.participantes.length) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 28px 12px; font-size: 11px; line-height: 1.5;">
        Nenhum participante no combate.<br>Clique em <b>+ Participante</b> para iniciar.
      </div>
    `;
    return;
  }

  store.participantes.forEach((p, idx) => {
    const isCurrent = idx === store.ativoIndex;
    const itemCard = document.createElement("div");
    itemCard.className = `combat-item ${isCurrent ? "is-current" : ""}`;

    const efeitosHtml = (p.efeitos || []).map(ef => `
      <span class="effect-pill" data-pid="${p.id}" data-efid="${ef.id}" title="Clique para remover este efeito">
        ${ef.nome} (${ef.duracao}t)
        <span style="font-size:10px; margin-left:3px; opacity:0.8;">✕</span>
      </span>
    `).join("");

    itemCard.innerHTML = `
      <div class="combat-item-main">
        <span class="turn-dot" title="${isCurrent ? "Vez deste personagem" : ""}"></span>
        <span class="combat-item-name" title="${p.nome}">${p.nome}</span>
        <input type="number" class="init-input" data-id="${p.id}" value="${p.iniciativa}" title="Iniciativa (clique para alterar e tecle Enter)">
        <button type="button" class="btn-icon btn-del-part" data-id="${p.id}" title="Remover da lista">✕</button>
      </div>
      <div class="effects-row">
        ${efeitosHtml}
        <button type="button" class="btn-add-effect" data-id="${p.id}">+ Efeito</button>
      </div>
      <div class="effect-inline-form" id="ef-form-${p.id}">
        <input type="text" class="inp-ef-nome" placeholder="Ex: Envenenado...">
        <input type="number" class="inp-ef-turnos" value="3" min="1" title="Turnos">
        <button type="button" class="btn-ef-ok">OK</button>
      </div>
    `;

    // Edição manual de iniciativa (Salva no Enter ou ao sair do campo)
    const inpInit = itemCard.querySelector(".init-input");
    inpInit.addEventListener("keydown", (e) => {
      if (e.key === "Enter") inpInit.blur();
    });
    inpInit.addEventListener("blur", (e) => {
      const novoVal = Number(e.target.value);
      if (novoVal !== Number(p.iniciativa)) {
        store.atualizarIniciativa(p.id, novoVal);
      }
    });

    // Remover participante
    itemCard.querySelector(".btn-del-part").addEventListener("click", () => {
      store.removerParticipante(p.id);
    });

    // Abrir mini-form inline de efeito (sem usar window.prompt)
    const btnAddEf = itemCard.querySelector(".btn-add-effect");
    const formEf = itemCard.querySelector(`#ef-form-${p.id}`);
    const inpEfNome = formEf.querySelector(".inp-ef-nome");
    const inpEfTurnos = formEf.querySelector(".inp-ef-turnos");
    const btnEfOk = formEf.querySelector(".btn-ef-ok");

    btnAddEf.addEventListener("click", () => {
      const aberto = formEf.classList.toggle("is-open");
      if (aberto) inpEfNome.focus();
    });

    const confirmarEfeito = () => {
      const nome = inpEfNome.value.trim();
      const turnos = inpEfTurnos.value;
      if (nome) {
        store.adicionarEfeito(p.id, nome, turnos);
      }
    };

    btnEfOk.addEventListener("click", confirmarEfeito);
    [inpEfNome, inpEfTurnos].forEach(inp => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") confirmarEfeito();
        if (e.key === "Escape") formEf.classList.remove("is-open");
      });
    });

    // Remover efeito individual
    itemCard.querySelectorAll(".effect-pill").forEach(el => {
      el.addEventListener("click", () => {
        store.removerEfeito(el.dataset.pid, el.dataset.efid);
      });
    });

    container.appendChild(itemCard);
  });
}

export async function popularSelectFichas(selectElement, OBR) {
  if (!selectElement) return;
  selectElement.innerHTML = `<option value="">-- Selecione uma Ficha --</option>`;

  try {
    let fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    const role = await OBR.player.getRole();

    // Se o jogador ainda não tinha aberto o painel, busca direto dos metadados da sala
    if (role !== "GM" && !fichas.length) {
      const meta = await OBR.room.getMetadata();
      if (Array.isArray(meta?.["solaria/sync_fichas"])) {
        fichas = meta["solaria/sync_fichas"];
      }
    }

    const visiveis = fichas.filter(f => role === "GM" || f.visivelPlayer !== false);

    visiveis.forEach(f => {
      const opt = document.createElement("option");
      opt.value = JSON.stringify({
        id: f.id,
        nome: f.nome,
        iniciativa: Math.floor(Math.random() * 20) + 1
      });
      opt.textContent = `${f.nome} (${f.tag || "NPC"})`;
      selectElement.appendChild(opt);
    });
  } catch (_) {}
}