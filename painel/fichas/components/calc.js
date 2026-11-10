/**
 * Avalia expressões matemáticas simples sem usar eval inseguro.
 * Suporta +, -, *, / e parênteses.
 */
function avaliarExpressaoMatematica(expr) {
  // Higieniza: permite apenas números e operadores matemáticos válidos
  const limpa = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!limpa) return null;

  try {
    // Parser seguro via Function construtora isolada
    const resultado = new Function(`return (${limpa})`)();
    return typeof resultado === "number" && !isNaN(resultado) ? resultado : null;
  } catch (_) {
    return null;
  }
}

/**
 * Aplica o cálculo no atributo com base na entrada do usuário:
 * - Se começar com '+' ou '-': soma/subtrai do valor atual (ex: "-10", "+5", "-10/2")
 * - Se começar com '*' ou '/': multiplica/divide o valor atual (ex: "*2", "/2")
 * - Se for valor absoluto (ex: "50", "20+5"): define diretamente o resultado
 *
 * @param {number|string} valorAtual - O valor que o campo possui no momento
 * @param {string} inputDigitado - O que o usuário escreveu no input
 * @returns {number} O novo valor arredondado
 */
export function calcularNovoStat(valorAtual, inputDigitado) {
  const atual = parseFloat(valorAtual) || 0;
  const texto = String(inputDigitado).trim();

  if (!texto) return atual;

  const primeiroChar = texto.charAt(0);

  // Caso 1: Operações relativas ao valor atual (+, -, *, /)
  if (primeiroChar === "+" || primeiroChar === "-") {
    const delta = avaliarExpressaoMatematica(texto);
    if (delta !== null) {
      return Math.round(atual + delta);
    }
  } else if (primeiroChar === "*" || primeiroChar === "/") {
    const resultado = avaliarExpressaoMatematica(`${atual} ${texto}`);
    if (resultado !== null) {
      return Math.round(resultado);
    }
  }

  // Caso 2: Valor absoluto (ex: digitou apenas "15" ou uma conta direta "10+5")
  const valorDireto = avaliarExpressaoMatematica(texto);
  return valorDireto !== null ? Math.round(valorDireto) : atual;
}