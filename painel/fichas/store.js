import { SolariaSync } from "../../core/sync.js";

const STORAGE_KEY = "solaria_fichas_custom";

export const SheetStore = {
  fichas: [],

  carregar(registrosEstaticos = []) {
    this.fichas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    registrosEstaticos.forEach(f => {
      if (!this.fichas.some(item => item.id === f.id)) {
        this.fichas.unshift({
          id: f.id,
          nome: f.nome,
          tag: f.tag || "NPC",
          visivelPlayer: f.visivelPlayer ?? true,
          stats: f.stats || { pv: "25", pm: "10", rm: "2", cd: "12", atk: "+4" },
          historico: f.desc || "",
          habilidades: f.habilidades || [],
          inventario: f.inventario || [],
          tokenId: null,
          tokenNome: null
        });
      }
    });
    return this.fichas;
  },

  salvar(notificarSala = true) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.fichas));
    if (notificarSala) {
      SolariaSync.sincronizarFichasComSala(this.fichas);
    }
  },

  obter(id) {
    return this.fichas.find(f => f.id === id);
  },

  adicionarOuAtualizar(dados, notificarSala = true) {
    const idx = this.fichas.findIndex(f => f.id === dados.id);
    if (idx >= 0) {
      this.fichas[idx] = dados;
    } else {
      this.fichas.unshift(dados);
    }
    this.salvar(notificarSala);
  },

  remover(id) {
    this.fichas = this.fichas.filter(f => f.id !== id);
    this.salvar(true);
  },

  /**
   * Mescla dados recebidos da sala (para clientes Jogador)
   */
  mesclarFichasPublicas(fichasPublicas = []) {
    this.fichas = fichasPublicas;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.fichas));
  }
};