import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

export const SYNC_KEY = "solaria/sync_combate";
const STORAGE_KEY = "solaria_combate_estado";

export const CombatStore = {
  rodada: 1,
  ativoIndex: 0,
  participantes: [],
  onChangeCallback: null,

  registrarCallback(cb) {
    this.onChangeCallback = cb;
  },

  notificarUI() {
    if (typeof this.onChangeCallback === "function") {
      this.onChangeCallback();
    }
  },

  carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (salvo && Array.isArray(salvo.participantes)) {
        this.rodada = salvo.rodada || 1;
        this.ativoIndex = salvo.ativoIndex || 0;
        this.participantes = salvo.participantes;
      }
    } catch (_) {}
    return this.obterPayload();
  },

  obterPayload() {
    return {
      rodada: this.rodada,
      ativoIndex: this.ativoIndex,
      participantes: this.participantes,
      atualizadoEm: Date.now()
    };
  },

  salvarLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.obterPayload()));
  },

  async sincronizarRede() {
    this.salvarLocal();
    this.notificarUI();
    const payload = this.obterPayload();
    try {
      await OBR.room.setMetadata({ [SYNC_KEY]: payload });
      await OBR.broadcast.sendMessage("solaria/combate-sync", payload);
    } catch (err) {
      console.error("Erro ao sincronizar combate:", err);
    }
  },

  mesclarRemoto(dados) {
    if (!dados || !Array.isArray(dados.participantes)) return;
    this.rodada = dados.rodada || 1;
    this.ativoIndex = dados.ativoIndex || 0;
    this.participantes = dados.participantes;
    this.salvarLocal();
    this.notificarUI();
  },

  ordenar() {
    const idAtivo = this.participantes[this.ativoIndex]?.id;
    this.participantes.sort((a, b) => (Number(b.iniciativa) || 0) - (Number(a.iniciativa) || 0));

    if (idAtivo) {
      const novoIdx = this.participantes.findIndex(p => p.id === idAtivo);
      this.ativoIndex = novoIdx >= 0 ? novoIdx : 0;
    } else {
      this.ativoIndex = 0;
    }
  },

  adicionarParticipante(nome, iniciativa, fichaId = null) {
    const novo = {
      id: "part_" + Date.now() + Math.random().toString(36).substring(2, 5),
      nome: nome.trim(),
      iniciativa: Number(iniciativa) || 10,
      fichaId: fichaId || null,
      efeitos: []
    };
    this.participantes.push(novo);
    this.ordenar();
    this.sincronizarRede();
  },

  removerParticipante(id) {
    const idxRemover = this.participantes.findIndex(p => p.id === id);
    if (idxRemover < 0) return;

    // Preserva corretamente de quem é a vez mesmo se remover alguém antes dele na fila
    if (idxRemover < this.ativoIndex) {
      this.ativoIndex--;
    }

    this.participantes.splice(idxRemover, 1);

    if (this.ativoIndex >= this.participantes.length) {
      this.ativoIndex = 0;
    }
    this.sincronizarRede();
  },

  atualizarIniciativa(id, novaIniciativa) {
    const p = this.participantes.find(item => item.id === id);
    if (p) {
      p.iniciativa = Number(novaIniciativa) || 0;
      this.ordenar();
      this.sincronizarRede();
    }
  },

  avancarTurno() {
    if (!this.participantes.length) return;

    this.ativoIndex++;
    if (this.ativoIndex >= this.participantes.length) {
      this.ativoIndex = 0;
      this.rodada++;
    }

    // Ao iniciar o turno do participante, reduz em 1 os contadores de efeitos dele
    const atual = this.participantes[this.ativoIndex];
    if (atual && Array.isArray(atual.efeitos)) {
      atual.efeitos = atual.efeitos
        .map(ef => ({ ...ef, duracao: Number(ef.duracao) - 1 }))
        .filter(ef => ef.duracao > 0);
    }

    this.sincronizarRede();
  },

  adicionarEfeito(participanteId, nomeEfeito, duracaoTurnos) {
    const p = this.participantes.find(item => item.id === participanteId);
    if (p && nomeEfeito.trim()) {
      if (!Array.isArray(p.efeitos)) p.efeitos = [];
      p.efeitos.push({
        id: "ef_" + Date.now() + Math.random().toString(36).substring(2, 4),
        nome: nomeEfeito.trim(),
        duracao: Math.max(1, parseInt(duracaoTurnos, 10) || 1)
      });
      this.sincronizarRede();
    }
  },

  removerEfeito(participanteId, efeitoId) {
    const p = this.participantes.find(item => item.id === participanteId);
    if (p && Array.isArray(p.efeitos)) {
      p.efeitos = p.efeitos.filter(ef => ef.id !== efeitoId);
      this.sincronizarRede();
    }
  },

  limpar() {
    this.rodada = 1;
    this.ativoIndex = 0;
    this.participantes = [];
    this.sincronizarRede();
  }
};