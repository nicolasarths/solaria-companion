import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { NotesStore } from "./notes-store.js";
import { criarCardNota } from "./note-card.js";

export function criarGerenciadorNotas(containerCards, Estado) {
  const STORAGE_ABERTURA = "solaria_notas_estados_abertura";
  const estadosAbertura = JSON.parse(localStorage.getItem(STORAGE_ABERTURA) || "{}");

  function obterFichasDisponiveis() {
    const fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    return fichas.filter(f => Estado.role === "GM" || f.visivelPlayer !== false);
  }

  function salvarEstados() {
    localStorage.setItem(STORAGE_ABERTURA, JSON.stringify(estadosAbertura));
  }

  function renderizar() {
    containerCards.innerHTML = "";
    const isGM = Estado.role === "GM";

    // Filtra as notas: Mestre vê todas; Jogador vê apenas as visíveis
    const notasFiltradas = NotesStore.notas.filter(n => isGM || n.visivelPlayer === true);

    if (!notasFiltradas.length) {
      containerCards.innerHTML = `
        <div style="text-align: center; color: #565f89; padding: 24px; font-size: 12px;">
          Nenhuma anotação disponível. ${isGM ? "Clique em <b>+ Nova Anotação</b> acima." : ""}
        </div>
      `;
      return;
    }

    const fichas = obterFichasDisponiveis();

    notasFiltradas.forEach((nota, idx) => {
      if (estadosAbertura[nota.id] === undefined) {
        estadosAbertura[nota.id] = idx === 0;
      }
      const aberta = estadosAbertura[nota.id];

      const card = criarCardNota({
        nota,
        aberta,
        role: Estado.role,
        fichasDisponiveis: fichas,
        onToggle: (estaAberta) => {
          estadosAbertura[nota.id] = estaAberta;
          salvarEstados();
        },
        onVisibilidadeChange: async () => {
          const novaVisibilidade = !nota.visivelPlayer;
          NotesStore.atualizarNota(nota.id, { visivelPlayer: novaVisibilidade });
          const notaAtualizada = NotesStore.notas.find(n => n.id === nota.id) || { ...nota, visivelPlayer: novaVisibilidade };

          try {
            if (novaVisibilidade) {
              await OBR.broadcast.sendMessage("solaria/nota-sync", notaAtualizada);
            } else {
              await OBR.broadcast.sendMessage("solaria/nota-excluida", nota.id);
            }
          } catch (_) {}

          renderizar();
        },
        onTituloChange: async (novoTitulo) => {
          NotesStore.atualizarNota(nota.id, { titulo: novoTitulo });
          const notaAtualizada = NotesStore.notas.find(n => n.id === nota.id) || nota;
          if (notaAtualizada.visivelPlayer) {
            try {
              await OBR.broadcast.sendMessage("solaria/nota-sync", notaAtualizada);
            } catch (_) {}
          }
        },
        onConteudoChange: async (novoConteudo) => {
          NotesStore.atualizarNota(nota.id, { conteudo: novoConteudo });
          const notaAtualizada = NotesStore.notas.find(n => n.id === nota.id) || nota;
          if (notaAtualizada.visivelPlayer) {
            try {
              await OBR.broadcast.sendMessage("solaria/nota-sync", notaAtualizada);
            } catch (_) {}
          }
        },
        onAnexosChange: async (novosAnexos) => {
          NotesStore.atualizarNota(nota.id, { anexos: novosAnexos });
          const notaAtualizada = NotesStore.notas.find(n => n.id === nota.id) || nota;
          if (notaAtualizada.visivelPlayer) {
            try {
              await OBR.broadcast.sendMessage("solaria/nota-sync", notaAtualizada);
            } catch (_) {}
          }
        },
        onExcluir: async () => {
          const idExcluir = nota.id;
          delete estadosAbertura[idExcluir];
          salvarEstados();
          NotesStore.excluirNota(idExcluir);

          try {
            await OBR.broadcast.sendMessage("solaria/nota-excluida", idExcluir);
          } catch (_) {}

          renderizar();
        },
        onNavegarFicha: (sheetId) => {
          if (typeof Estado.irParaCard === "function") {
            Estado.irParaCard("fichas", sheetId);
          } else {
            document.querySelector('[data-tab="fichas"]')?.click();
            setTimeout(() => {
              const el = document.getElementById(`card-${sheetId}`);
              if (el) {
                el.classList.add("is-open");
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 100);
          }
        }
      });

      containerCards.appendChild(card);
    });
  }

  function adicionarNota() {
    const nova = NotesStore.criarNovaNota("Nova Anotação");
    estadosAbertura[nova.id] = true;
    salvarEstados();
    renderizar();

    setTimeout(() => {
      const cardNovo = document.getElementById(`note-card-${nova.id}`);
      if (cardNovo) {
        cardNovo.scrollIntoView({ behavior: "smooth", block: "start" });
        const input = cardNovo.querySelector(".note-title-input");
        if (input) {
          input.focus();
          input.select();
        }
      }
    }, 50);
  }

  return {
    renderizar,
    adicionarNota
  };
}