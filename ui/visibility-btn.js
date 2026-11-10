/**
 * Componente Reutilizável de Botão de Visibilidade / Permissão (Solaria)
 */

export function obterIconePermissao(objeto) {
  if (objeto.visivelPlayer === false) return "🔒";
  if (!objeto.editavelPlayer) return "👁️";
  return "✍️";
}

export function obterTituloPermissao(objeto) {
  if (objeto.visivelPlayer === false) return "Status: Oculto para jogadores (Clique para liberar Leitura)";
  if (!objeto.editavelPlayer) return "Status: Jogador pode Ver apenas (Clique para liberar Edição)";
  return "Status: Jogador pode Ver e Editar (Clique para Ocultar)";
}

/**
 * Cria o elemento de botão de permissão para injetar no cabeçalho dos cards
 * @param {Object} objeto - Ficha ou Nota
 * @param {Function} aoMudarPermissao - Callback executado ao clicar no botão
 * @param {string} classExtra - Classes CSS adicionais
 * @returns {HTMLButtonElement} Botão configurado
 */
export function criarBotaoVisibilidade(objeto, aoMudarPermissao, classExtra = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-toggle-permissao ${classExtra}`.trim();
  btn.title = obterTituloPermissao(objeto);
  btn.textContent = obterIconePermissao(objeto);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    let novasPermissoes = {};
    if (objeto.visivelPlayer === false) {
      novasPermissoes = { visivelPlayer: true, editavelPlayer: false };
    } else if (!objeto.editavelPlayer) {
      novasPermissoes = { visivelPlayer: true, editavelPlayer: true };
    } else {
      novasPermissoes = { visivelPlayer: false, editavelPlayer: false };
    }

    if (typeof aoMudarPermissao === "function") {
      aoMudarPermissao(novasPermissoes);
    }
  });

  return btn;
}