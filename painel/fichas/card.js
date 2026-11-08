import { renderStatsCard } from "./stats.js";
import { renderHistoricoCard } from "./historico.js";
import { renderHabilidadesCard } from "./habilidades.js";
import { renderInventarioCard } from "./inventario.js";
import { selecionarTokenNoGrid, desvincularToken, obterDadosTokenSelecionado, vincularTokenAoId } from "./obr-sync.js";
import { atualizarHudToken, removerHudToken } from "./token-hud.js";

export function criarElementoCard(f, role, acoes) {
  const isGM = role === "GM";

  // Se a ficha não é visível para jogadores e o usuário atual é jogador, não renderiza
  if (!isGM && !f.visivelPlayer) {
    const placeholder = document.createElement("div");
    placeholder.style.display = "none";
    return placeholder;
  }

  const card = document.createElement("div");
  card.className = "sheet-card";
  card.id = `card-${f.id}`;

  const isVisivel = f.visivelPlayer !== false;

  card.innerHTML = `
    <div class="sheet-card-header">
      <div class="sheet-title">
        <span>${f.nome}</span>
      </div>
      <div class="sheet-actions">
        <span class="sheet-tag-badge">${f.tag || "NPC"}</span>
        ${isGM ? `
          <button type="button" class="btn-icon-action btn-toggle-visibilidade" title="${isVisivel ? "Visível para jogadores (clique para ocultar)" : "Oculto para jogadores (clique para revelar)"}">
            ${isVisivel ? "👁️" : "🔒"}
          </button>
          <button type="button" class="btn-icon-action btn-edit" title="Editar Ficha">✏️</button>
        ` : ""}
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

  // Se for visão de jogador, desativa inputs de stats para impedir edição
  if (!isGM) {
    card.querySelectorAll(".stat-calc-input, input").forEach(input => {
      input.setAttribute("readonly", "true");
      input.style.cursor = "default";
      input.style.border = "none";
      input.style.background = "transparent";
    });
  }

  // Alterna expansão do card (ignora cliques nos botões de ação)
  card.querySelector(".sheet-card-header").addEventListener("click", (e) => {
    if (
      e.target.closest(".btn-edit") ||
      e.target.closest(".btn-toggle-visibilidade") ||
      e.target.closest(".token-link-row") ||
      e.target.closest(".stat-calc-input")
    ) {
      return;
    }
    card.classList.toggle("is-open");
  });

  card.querySelector(".btn-select-token")?.addEventListener("click", () => selecionarTokenNoGrid(f.tokenId));

  if (isGM) {
    // Alternar visibilidade diretamente no card (um clique rápido)
    card.querySelector(".btn-toggle-visibilidade")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      f.visivelPlayer = !(f.visivelPlayer !== false);
      acoes.onAtualizar();
      await atualizarHudToken(f);
    });

    card.querySelector(".btn-edit")?.addEventListener("click", () => acoes.onEditar(f));

    card.querySelector(".btn-token-unlink")?.addEventListener("click", async () => {
      const idParaRemover = f.tokenId;
      f.tokenId = null;
      f.tokenNome = null;
      acoes.onAtualizar();

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
      acoes.onAtualizar();

      await vincularTokenAoId(token.tokenId, f.id);
      await atualizarHudToken(f);
    });
  }

  return card;
}