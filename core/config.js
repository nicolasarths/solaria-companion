/**
 * Configurações Centrais de Ambiente e Roteamento - Solaria Companion
 */
export const IS_LOCAL = 
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1";

export const GITHUB_PAGES_URL = "https://nicolasarths.github.io/solaria-companion";

// Em ambiente local, caminhos relativos ("") são usados; em produção, a URL canônica do GitHub Pages
export const BASE_URL = IS_LOCAL ? "" : GITHUB_PAGES_URL;

/**
 * Utilitário para resolver rotas absolutas seguras tanto no localhost quanto no Pages
 * @param {string} path - Caminho relativo partindo da raiz (ex: "/combate/combate.html")
 * @returns {string} URL completa ou caminho relativo correto
 */
export function resolverRota(path) {
  const limpo = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${limpo}`;
}