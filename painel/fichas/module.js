import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { vincularCalculosCard } from "./components/stats.js";
import { SheetStore } from "./store.js";
import { criarElementoCard } from "./components/card.js";
import { renderFormulario } from "./components/form.js";
import { iniciarOuvintesOwlbear } from "./obr-sync.js";
import { atualizarHudToken, removerHudToken, sincronizarTodosHuds } from "../../hud/token-hud.js";
import { SolariaSync } from "../../core/sync.js";

export function render(container, Estado) {
  if (!document.getElementById("css-fichas")) {
    const link = document.createElement("link");
    link.id = "css-fichas";
    link.rel = "stylesheet";
    link.href = "./fichas/style.css";
    document.head.appendChild(link);
  }

  SheetStore.carregar(Estado.modulos.fichas?.registros);
  sincronizarTodosHuds(SheetStore.fichas);

  SolariaSync.iniciarOuvinteSala({
    onFichasRecebidas: (fichasPublicas) => {
      if (Estado.realRole !== "GM") {
        SheetStore.mesclarFichasPublicas(fichasPublicas);
        renderLista();
      }
    }
  });

  OBR.broadcast.onMessage("solaria/ficha-sync", () => {
    SheetStore.carregar();
    renderLista();
  });

  OBR.broadcast.onMessage("solaria/ficha-excluida", () => {
    SheetStore.carregar();
    renderLista();
  });

  OBR.broadcast.onMessage("solaria/ficha-stat-atualizado", () => {
    SheetStore.carregar();
    renderLista();
  });

  function focarCardFicha(sheetId) {
    const btnTab = document.querySelector('[data-tab="fichas"]');
    if (btnTab && !btnTab.classList.contains("active")) btnTab.click();
    setTimeout(() => {
      const card = document.getElementById(`card-${sheetId}`);
      if (card) {
        card.classList.add("is-open");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
  }

  function executarCriacaoComToken(tokenId, tokenNome) {
    const btnTab = document.querySelector('[data-tab="fichas"]');
    if (btnTab && !btnTab.classList.contains("active")) btnTab.click();

    abrirForm({
      id: "f_" + Date.now(),
      nome: tokenNome,
      tag: "NPC",
      visivelPlayer: true,
      editavelPlayer: false,
      stats: { pv: "20", pm: "10", rm: "0", cd: "10", atk: "+0" },
      historico: "",
      habilidades: [],
      inventario: [],
      tokenId: tokenId,
      tokenNome: tokenNome
    });
  }

  function checarAcaoPendente() {
    const acaoRaw = localStorage.getItem("solaria_acao_pendente");
    if (!acaoRaw) return;

    try {
      const acao = JSON.parse(acaoRaw);
      localStorage.removeItem("solaria_acao_pendente");
      if (Date.now() - acao.timestamp < 15000) {
        if (acao.tipo === "CRIAR_FICHA") {
          setTimeout(() => executarCriacaoComToken(acao.tokenId, acao.tokenNome), 100);
        } else if (acao.tipo === "FOCAR_FICHA") {
          setTimeout(() => focarCardFicha(acao.sheetId), 100);
        }
      }
    } catch (_) {}
  }

  OBR.broadcast.onMessage("solaria/criar-ficha-token", (e) => {
    localStorage.removeItem("solaria_acao_pendente");
    executarCriacaoComToken(e.data.tokenId, e.data.tokenNome);
  });

  OBR.broadcast.onMessage("solaria/focar-ficha-token", (e) => {
    localStorage.removeItem("solaria_acao_pendente");
    focarCardFicha(e.data.sheetId);
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "solaria_acao_pendente" && e.newValue) checarAcaoPendente();
  });

  function renderLista() {
    container.innerHTML = `
      <div class="fichas-container">
        <div class="fichas-topbar">
          <input type="text" id="busca-ficha" placeholder="Buscar ficha..." style="flex:1;">
          ${Estado.role === "GM" ? `<button id="btn-nova-ficha" class="btn-primary">+ Nova Ficha</button>` : ""}
        </div>
        <div id="list-fichas-container" class="fichas-scroll"></div>
      </div>
    `;

    const listDiv = container.querySelector("#list-fichas-container");
    const busca = container.querySelector("#busca-ficha");

    if (Estado.role === "GM") {
      container.querySelector("#btn-nova-ficha").addEventListener("click", () => abrirForm(null));
    }

    const desenhar = () => {
      listDiv.innerHTML = "";
      const termo = busca.value.toLowerCase();
      
      const filtradas = SheetStore.fichas.filter(f => 
        (Estado.role === "GM" || f.visivelPlayer !== false) && f.nome.toLowerCase().includes(termo)
      );

      filtradas.forEach(f => {
        const card = criarElementoCard(f, Estado.role, {
          onEditar: (item) => abrirForm(item),
          onAtualizar: (fichaAtualizada) => { 
            const isGM = Estado.role === "GM";
            SheetStore.salvar(isGM); 
            if (fichaAtualizada) OBR.broadcast.sendMessage("solaria/ficha-sync", fichaAtualizada);
            desenhar(); 
          }
        });
        listDiv.appendChild(card);
      });

      // Permite cálculos matemáticos nos inputs para quem tem permissão de edição
      vincularCalculosCard(listDiv, async (fichaId, callbackMutacao) => {
        const ficha = SheetStore.obter(fichaId);
        if (ficha) {
          const isGM = Estado.role === "GM";
          const isEditavel = isGM || ficha.editavelPlayer === true;
          if (!isEditavel) return;

          callbackMutacao(ficha);
          SheetStore.salvar(isGM);
          if (isGM) {
            await atualizarHudToken(ficha);
          }
          OBR.broadcast.sendMessage("solaria/ficha-sync", ficha);
        }
      });
    };

    busca.addEventListener("input", desenhar);
    desenhar();
  }

  function abrirForm(ficha) {
    renderFormulario(
      container,
      ficha,
      () => renderLista(),
      async (dadosSalvos) => {
        const isGM = Estado.role === "GM";
        SheetStore.adicionarOuAtualizar(dadosSalvos, isGM);
        if (isGM) {
          await atualizarHudToken(dadosSalvos);
        }
        OBR.broadcast.sendMessage("solaria/ficha-sync", dadosSalvos);
        renderLista();
      },
      async (idExcluir) => {
        const isGM = Estado.role === "GM";
        if (!isGM) return;
        const f = SheetStore.obter(idExcluir);
        if (f?.tokenId) await removerHudToken(f.tokenId, idExcluir);
        SheetStore.remover(idExcluir);
        OBR.broadcast.sendMessage("solaria/ficha-excluida", idExcluir);
        renderLista();
      },
      Estado.role
    );
  }

  iniciarOuvintesOwlbear(
    (sheetId) => focarCardFicha(sheetId),
    (tokenId, tokenNome) => executarCriacaoComToken(tokenId, tokenNome)
  );

  renderLista();
  checarAcaoPendente();
}