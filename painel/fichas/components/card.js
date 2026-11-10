import { renderStatsCard } from "./stats.js";
import { renderHistoricoCard } from "./historico.js";
import { renderHabilidadesCard } from "./habilidades.js";
import { renderInventarioCard } from "./inventario.js";
import { selecionarTokenNoGrid, desvincularToken, obterDadosTokenSelecionado, vincularTokenAoId } from "../obr-sync.js";
import { atualizarHudToken, removerHudToken } from "../../../hud/token-hud.js";
import { criarBotaoVisibilidade } from "../../../ui/visibility-btn.js";

export function criarElementoCard(f, role, acoes) {
  const isGM = role === "GM";
  const isVisivel = f.visivelPlayer !== false;
  const isEditavel = isGM || f.editavelPlayer === true;

  // Bloqueio rigoroso se estiver oculto e o usuário for jogador
  if (!isGM && !isVisivel) {
    const placeholder = document.createElement("div");
    placeholder.style.display = "none";
    return placeholder;
  }

  const card = document.createElement("div");
  card.className = "sheet-card";
  card.id = `card-${f.id}`;

  card.innerHTML = `
    <div class="sheet-card-header">
      <div class="sheet-title">
        <span>${f.nome}</span>
        ${!isGM && f.editavelPlayer ? `<span title="Você pode editar esta ficha" style="font-size:11px;">✍️</span>` : ""}
      </div>
      <div class="sheet-actions">
        <span class="sheet-tag-badge">${f.tag || "NPC"}</span>
        <div class="visibility-btn-slot"></div>
        ${isEditavel ? `<button type="button" class="btn-icon-action btn-edit" title="Editar Ficha">✏️</button>` : ""}
      </div>
    </div>

    ${isGM ? `
      <div class="token-link-row">
        <div class="token-link-status">
          ${f.tokenId ? `
            <span class="token-badge-active btn-select-token" title="Selecionar no mapa">🎯 ${f.tokenNome || "Token"}</span>
            <button type="button" class="btn-token-unlink" title="Desvincular token">×</button>
          ` : `<span style="color:var(--text-muted);">Sem token no mapa</span>`}
        </div>
        <button type="button" class="btn-token-link btn-bind-token">${f.tokenId ? "Alterar Token" : "🎯 Vincular Token"}</button>
      </div>
    ` : (f.tokenId ? `
      <div class="token-link-row">
        <div class="token-link-status">
          <span class="token-badge-active btn-select-token" title="Selecionar no mapa">🎯 ${f.tokenNome || "Token"}</span>
        </div>
      </div>
    ` : "")}

    ${renderStatsCard(f.stats, f.id)}

    <div class="sheet-body-content">
      ${renderHistoricoCard(f.historico)}
      ${renderHabilidadesCard(f.habilidades)}
      ${renderInventarioCard(f.inventario)}
    </div>
  `;

  // Se não tiver permissão de edição, trava os inputs em modo leitura
  if (!isEditavel) {
    card.querySelectorAll(".stat-calc-input, input").forEach(input => {
      input.setAttribute("readonly", "true");
      input.style.cursor = "default";
      input.style.border = "none";
      input.style.background = "transparent";
    });
  }

  // Insere o botão de visibilidade modularizado caso seja GM
  const visibilitySlot = card.querySelector(".visibility-btn-slot");
  if (isGM && visibilitySlot) {
    const btnVisibilidade = criarBotaoVisibilidade(f, async (novasPermissoes) => {
      Object.assign(f, novasPermissoes);
      acoes.onAtualizar(f);
      await atualizarHudToken(f);
    }, "btn-icon-action");
    visibilitySlot.appendChild(btnVisibilidade);
  }

  card.querySelector(".sheet-card-header").addEventListener("click", (e) => {
    if (
      e.target.closest(".btn-edit") ||
      e.target.closest(".btn-toggle-permissao") ||
      e.target.closest(".token-link-row") ||
      e.target.closest(".stat-calc-input")
    ) return;
    
    card.classList.toggle("is-open");
  });

  card.querySelector(".btn-select-token")?.addEventListener("click", () => selecionarTokenNoGrid(f.tokenId));

  // Ação de editar disponível para GM ou jogador com permissão
  if (isEditavel) {
    card.querySelector(".btn-edit")?.addEventListener("click", () => acoes.onEditar(f));
  }

  if (isGM) {
    card.querySelector(".btn-token-unlink")?.addEventListener("click", async () => {
      const idParaRemover = f.tokenId;
      f.tokenId = null;
      f.tokenNome = null;
      acoes.onAtualizar(f);

      if (idParaRemover) {
        await removerHudToken(idParaRemover);
        await desvincularToken(idParaRemover);
      }
    });

    card.querySelector(".btn-bind-token")?.addEventListener("click", async () => {
      const token = await obterDadosTokenSelecionado();
      if (!token) {
        alert("Selecione primeiro o token no mapa do Owlbear Rodeo!");
        return;
      }
      f.tokenId = token.tokenId;
      f.tokenNome = token.tokenNome;
      acoes.onAtualizar(f);

      await vincularTokenAoId(token.tokenId, f.id);
      await atualizarHudToken(f);
    });
  }

  return card;
}