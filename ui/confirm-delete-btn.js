/**
 * Componente Reutilizável de Botão de Exclusão com Confirmação (Solaria)
 */

/**
 * Cria o botão de exclusão com temporizador de segurança para duplo clique
 * @param {Function} aoConfirmarExclusao - Callback executado no segundo clique
 * @param {string} classExtra - Classes CSS adicionais
 * @returns {HTMLButtonElement} Botão configurado
 */
export function criarBotaoConfirmarExclusao(aoConfirmarExclusao, classExtra = "btn-delete-note") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = classExtra;
  btn.title = "Clique duas vezes para excluir";
  btn.textContent = "✕";

  let resetTimer = null;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (btn.classList.contains("confirm-delete")) {
      clearTimeout(resetTimer);
      btn.classList.remove("confirm-delete");
      btn.textContent = "✕";
      if (typeof aoConfirmarExclusao === "function") {
        aoConfirmarExclusao();
      }
      return;
    }

    btn.classList.add("confirm-delete");
    btn.textContent = "Excluir?";

    resetTimer = setTimeout(() => {
      btn.classList.remove("confirm-delete");
      btn.textContent = "✕";
    }, 3000);
  });

  return btn;
}