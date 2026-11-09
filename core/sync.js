import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

export const SYNC_KEYS = {
  FICHAS: "solaria/sync_fichas",
  NOTAS: "solaria/sync_notas"
};

export const SolariaSync = {
  /**
   * Mestre publica todas as fichas visíveis nos metadados da sala
   */
  async sincronizarFichasComSala(fichas = []) {
    try {
      const role = await OBR.player.getRole();
      if (role !== "GM") return;

      const fichasPublicas = fichas.filter(f => f.visivelPlayer !== false);
      await OBR.room.setMetadata({
        [SYNC_KEYS.FICHAS]: fichasPublicas
      });
    } catch (err) {
      console.error("Erro ao sincronizar fichas no Room Metadata:", err);
    }
  },

  /**
   * Mestre publica todas as anotações visíveis nos metadados da sala
   */
  async sincronizarNotasComSala(notas = []) {
    try {
      const role = await OBR.player.getRole();
      if (role !== "GM") return;

      const notasPublicas = notas.filter(n => n.visivelPlayer === true);
      await OBR.room.setMetadata({
        [SYNC_KEYS.NOTAS]: notasPublicas
      });
    } catch (err) {
      console.error("Erro ao sincronizar notas no Room Metadata:", err);
    }
  },

  /**
   * Inicia escuta contínua de Room Metadata para atualizar o cliente do Jogador
   */
  iniciarOuvinteSala({ onFichasRecebidas, onNotasRecebidas }) {
    // 1. Carrega dados iniciais da sala imediatamente
    OBR.room.getMetadata().then((meta) => {
      if (meta?.[SYNC_KEYS.FICHAS] && typeof onFichasRecebidas === "function") {
        onFichasRecebidas(meta[SYNC_KEYS.FICHAS]);
      }
      if (meta?.[SYNC_KEYS.NOTAS] && typeof onNotasRecebidas === "function") {
        onNotasRecebidas(meta[SYNC_KEYS.NOTAS]);
      }
    }).catch(() => {});

    // 2. Ouve alterações em tempo real na sala
    return OBR.room.onMetadataChange((meta) => {
      if (meta?.[SYNC_KEYS.FICHAS] && typeof onFichasRecebidas === "function") {
        onFichasRecebidas(meta[SYNC_KEYS.FICHAS]);
      }
      if (meta?.[SYNC_KEYS.NOTAS] && typeof onNotasRecebidas === "function") {
        onNotasRecebidas(meta[SYNC_KEYS.NOTAS]);
      }
    });
  }
};