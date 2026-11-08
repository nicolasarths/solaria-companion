import { NotesStore } from "./notes-store.js";
import { criarCardNota } from "./note-card.js";

/**
 * Gerenciador da lista de cartões de anotações e estado de abertura
 */
export function criarGerenciadorNotas(containerCards, Estado) {
  const STORAGE_ABERTURA = "solaria_notas_estados_abertura";
  const estadosAbertura = JSON.parse(localStorage.getItem(STORAGE_ABERTURA) || "{}");

  function obterFichasDisponiveis() {
    const fichas = JSON.parse(localStorage.getItem("solaria_fichas_custom") || "[]");
    return fichas.filter(f => Estado.role === "GM" || f.visivelPlayer);
  }

  function salvarEstados() {
    localStorage.setItem(STORAGE_ABERTURA, JSON.stringify(estadosAbertura));
  }

  function renderizar() {
    containerCards.innerHTML = "";

    if (!NotesStore.notas.length) {
      containerCards.innerHTML = `
        <div style="text-align: center; color: #565f89; padding: 24px; font-size: 12px;">
          Nenhuma anotação criada. Clique em <b>+ Nova Anotação</b> acima.
        </div>
      `;
      return;
    }

    const fichas = obterFichasDisponiveis();

    NotesStore.notas.forEach((nota, idx) => {
      if (estadosAbertura[nota.id] === undefined) {
        estadosAbertura[nota.id] = idx === 0;
      }
      const aberta = estadosAbertura[nota.id];

      const card = criarCardNota({
        nota,
        aberta,
        fichasDisponiveis: fichas,
        onToggle: (estaAberta) => {
          estadosAbertura[nota.id] = estaAberta;
          salvarEstados();
        },
        onTituloChange: (novoTitulo) => {
          NotesStore.atualizarNota(nota.id, { titulo: novoTitulo });
        },
        onConteudoChange: (novoConteudo) => {
          NotesStore.atualizarNota(nota.id, { conteudo: novoConteudo });
        },
        onAnexosChange: (novosAnexos) => {
          NotesStore.atualizarNota(nota.id, { anexos: novosAnexos });
        },
        onExcluir: () => {
          delete estadosAbertura[nota.id];
          salvarEstados();
          NotesStore.excluirNota(nota.id);
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