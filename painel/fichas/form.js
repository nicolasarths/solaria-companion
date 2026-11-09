import { renderStatsForm, getStatsFormData } from "./stats.js";
import { renderHistoricoForm, getHistoricoFormData } from "./historico.js";
import { renderHabilidadesForm, getHabilidadesFormData } from "./habilidades.js";
import { renderInventarioForm, getInventarioFormData } from "./inventario.js";
import { vincularTokenAoId, desvincularToken } from "./obr-sync.js";

export function renderFormulario(container, ficha, onVoltar, onSalvar, onExcluir, role = "GM") {
  const isGM = role === "GM";
  const editando = Boolean(ficha && ficha.criada);
  const dados = ficha ? JSON.parse(JSON.stringify(ficha)) : {
    id: "f_" + Date.now(),
    nome: "",
    tag: "NPC",
    visivelPlayer: true,
    editavelPlayer: false,
    stats: { pv: "20", pm: "10", rm: "0", cd: "10", atk: "+0" },
    historico: "",
    habilidades: [],
    inventario: [],
    tokenId: null,
    tokenNome: null
  };

  container.innerHTML = `
    <div class="sheet-form">
      <div class="form-header-bar">
        <span class="form-title">${editando ? "Editar Ficha" : "Nova Ficha"}</span>
        <button id="btn-voltar" class="btn-secondary">Voltar</button>
      </div>

      ${dados.tokenId ? `
        <div style="background: rgba(158, 206, 106, 0.12); border: 1px solid rgba(158, 206, 106, 0.35); border-radius: 6px; padding: 6px 10px; font-size: 11px; color: #9ece6a;">
          🎯 Token: <strong>${dados.tokenNome}</strong>
        </div>
      ` : ""}

      <div style="display:flex; gap:6px;">
        <input type="text" id="f-nome" style="flex:1;" placeholder="Nome da Entidade *" value="${dados.nome}">
        <input type="text" id="f-tag" style="width:80px;" placeholder="Tag" value="${dados.tag}">
      </div>

      ${isGM ? `
        <div style="display:flex; flex-direction:column; gap:6px; background:#14161f; padding:8px; border-radius:6px; border:1px solid #2f354d;">
          <label style="font-size:11px; display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" id="f-visivel" ${dados.visivelPlayer !== false ? "checked" : ""}>
            <span>👁️ Visível para Jogadores</span>
          </label>
          <label style="font-size:11px; display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" id="f-editavel" ${dados.editavelPlayer === true ? "checked" : ""}>
            <span>✍️ Permitir que Jogadores Editem (Ver e Editar)</span>
          </label>
        </div>
      ` : ""}

      <div id="area-stats"></div>
      <div id="area-historico"></div>
      <div id="area-habilidades"></div>
      <div id="area-inventario"></div>

      <div style="display:flex; gap:8px; margin-top:12px;">
        <button id="btn-salvar" class="btn-primary" style="flex:1; padding:8px;">Guardar Ficha</button>
        ${editando && isGM ? `<button id="btn-excluir" class="btn-secondary" style="color:var(--danger); border-color:var(--danger);">Excluir</button>` : ""}
      </div>
    </div>
  `;

  container.querySelector("#area-stats").innerHTML = renderStatsForm(dados.stats);
  renderHistoricoForm(container.querySelector("#area-historico"), dados.historico);
  renderHabilidadesForm(container.querySelector("#area-habilidades"), dados.habilidades);
  renderInventarioForm(container.querySelector("#area-inventario"), dados.inventario);

  container.querySelector("#btn-voltar").addEventListener("click", onVoltar);

  if (editando && isGM) {
    container.querySelector("#btn-excluir").addEventListener("click", async () => {
      await desvincularToken(dados.tokenId);
      onExcluir(dados.id);
    });
  }

  container.querySelector("#btn-salvar").addEventListener("click", async () => {
    const nome = container.querySelector("#f-nome").value.trim();
    if (!nome) return alert("Preencha ao menos o Nome.");

    dados.nome = nome;
    dados.tag = container.querySelector("#f-tag").value.trim() || "NPC";

    if (isGM) {
      dados.visivelPlayer = container.querySelector("#f-visivel").checked;
      dados.editavelPlayer = container.querySelector("#f-editavel").checked;
    }

    dados.stats = getStatsFormData(container, dados.stats);
    dados.historico = getHistoricoFormData(container);
    dados.habilidades = getHabilidadesFormData(container);
    dados.inventario = getInventarioFormData(container);
    dados.criada = true;

    if (dados.tokenId && isGM) await vincularTokenAoId(dados.tokenId, dados.id);
    onSalvar(dados);
  });
}