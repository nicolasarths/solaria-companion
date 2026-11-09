import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { CombatStore, SYNC_KEY } from "./store.js";
import { renderizarCombate, popularSelectFichas } from "./ui.js";

OBR.onReady(async () => {
  const listContainer = document.getElementById("combat-list-container");
  const atualizarTela = () => renderizarCombate(listContainer, CombatStore);

  CombatStore.registrarCallback(atualizarTela);
  CombatStore.carregar();

  // 1. Puxa estado inicial da sala
  try {
    const meta = await OBR.room.getMetadata();
    if (meta?.[SYNC_KEY]) {
      CombatStore.mesclarRemoto(meta[SYNC_KEY]);
    }
  } catch (_) {}

  // 2. Ouve mudanças de Room Metadata e Broadcast em tempo real
  OBR.room.onMetadataChange((meta) => {
    if (meta?.[SYNC_KEY]) {
      CombatStore.mesclarRemoto(meta[SYNC_KEY]);
    }
  });

  OBR.broadcast.onMessage("solaria/combate-sync", (e) => {
    if (e.data) {
      CombatStore.mesclarRemoto(e.data);
    }
  });

  // 3. Controles Principais
  document.getElementById("btn-proximo-turno").addEventListener("click", () => {
    CombatStore.avancarTurno();
  });

  document.getElementById("btn-fechar-combate").addEventListener("click", async () => {
    try {
      await OBR.broadcast.sendMessage("solaria/combate-fechado", true, { destination: "LOCAL" });
    } catch (_) {}
    await OBR.popover.close("solaria-painel-combate");
  });

  document.getElementById("btn-limpar-lista").addEventListener("click", () => {
    if (window.confirm("Deseja zerar a lista de iniciativa e reiniciar no Turno 1?")) {
      CombatStore.limpar();
    }
  });

  // 4. Gaveta de Adição
  const drawer = document.getElementById("add-drawer");
  const selFicha = document.getElementById("sel-ficha-existente");
  const inpNome = document.getElementById("inp-custom-nome");
  const inpInit = document.getElementById("inp-custom-init");

  document.getElementById("btn-toggle-add").addEventListener("click", async () => {
    const abriu = drawer.classList.toggle("is-open");
    if (abriu) {
      await popularSelectFichas(selFicha, OBR);
    }
  });

  document.getElementById("btn-fechar-drawer").addEventListener("click", () => {
    drawer.classList.remove("is-open");
  });

  document.getElementById("btn-confirmar-add").addEventListener("click", () => {
    let nome = inpNome.value.trim();
    let init = parseInt(inpInit.value, 10);
    let fichaId = null;

    if (selFicha.value) {
      try {
        const f = JSON.parse(selFicha.value);
        if (!nome) nome = f.nome;
        if (isNaN(init)) init = f.iniciativa;
        fichaId = f.id;
      } catch (_) {}
    }

    if (!nome) {
      inpNome.focus();
      return;
    }

    if (isNaN(init)) {
      init = Math.floor(Math.random() * 20) + 1;
    }

    CombatStore.adicionarParticipante(nome, init, fichaId);
    drawer.classList.remove("is-open");
    inpNome.value = "";
    inpInit.value = "";
    selFicha.value = "";
  });

  atualizarTela();
});