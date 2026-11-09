import { SolariaSync } from "../../core/sync.js";

const STORAGE_KEY = "solaria_notas_multiplas";

export const NotesStore = {
  notas: [],
  idAtiva: null,

  carregar() {
    try {
      const salvas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(salvas)) {
        this.notas = salvas;
      } else {
        const antiga = localStorage.getItem("solaria_notas") || "";
        this.notas = [
          {
            id: "note_" + Date.now(),
            titulo: "Diário de Campanha",
            conteudo: antiga,
            visivelPlayer: false,
            atualizadaEm: Date.now()
          }
        ];
        this.salvar();
      }
    } catch (_) {
      this.notas = [];
    }

    if (!this.idAtiva || !this.notas.some(n => String(n.id) === String(this.idAtiva))) {
      this.idAtiva = this.notas[0]?.id || null;
    }
    return this.notas;
  },

  salvar(notificarSala = true) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notas));
    if (notificarSala) {
      SolariaSync.sincronizarNotasComSala(this.notas);
    }
  },

  obterAtiva() {
    return this.notas.find(n => String(n.id) === String(this.idAtiva)) || null;
  },

  definirAtiva(id) {
    this.idAtiva = id;
  },

  criarNovaNota(titulo = "Nova Anotação") {
    const nova = {
      id: "note_" + Date.now(),
      titulo,
      conteudo: "",
      visivelPlayer: false,
      atualizadaEm: Date.now()
    };
    this.notas.unshift(nova);
    this.idAtiva = nova.id;
    this.salvar(true);
    return nova;
  },

  atualizarNota(id, dados) {
    const nota = this.notas.find(n => String(n.id) === String(id));
    if (!nota) return;
    Object.assign(nota, dados, { atualizadaEm: Date.now() });
    this.salvar(true);
  },

  excluirNota(id) {
    this.notas = this.notas.filter(n => String(n.id) !== String(id));
    if (String(this.idAtiva) === String(id)) {
      this.idAtiva = this.notas[0]?.id || null;
    }
    this.salvar(true);
  },

  /**
   * Mescla notas públicas recebidas do Room Metadata
   */
  mesclarNotasPublicas(notasPublicas = []) {
    this.notas = notasPublicas;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notas));
  }
};