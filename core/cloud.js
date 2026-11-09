import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { SolariaSync } from "./sync.js";

const STORAGE_KEYS = {
  BIN_ID: "solaria_cloud_bin_id",
  MASTER_KEY: "solaria_cloud_master_key",
  FICHAS: "solaria_fichas_custom",
  NOTAS: "solaria_notas_multiplas"
};

export const SolariaCloud = {
  obterCredenciais() {
    return {
      binId: (localStorage.getItem(STORAGE_KEYS.BIN_ID) || "").trim(),
      masterKey: (localStorage.getItem(STORAGE_KEYS.MASTER_KEY) || "").trim()
    };
  },

  salvarCredenciais(binId, masterKey) {
    localStorage.setItem(STORAGE_KEYS.BIN_ID, (binId || "").trim());
    localStorage.setItem(STORAGE_KEYS.MASTER_KEY, (masterKey || "").trim());
  },

  /**
   * Salva fichas e anotações no JSONBin.io
   */
  async salvarNuvem(binId, masterKey) {
    const bId = binId || this.obterCredenciais().binId;
    const mKey = masterKey || this.obterCredenciais().masterKey;

    if (!bId || !mKey) {
      throw new Error("Preencha o Bin ID e a Master Key antes de salvar.");
    }

    const fichas = JSON.parse(localStorage.getItem(STORAGE_KEYS.FICHAS) || "[]");
    const notas = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTAS) || "[]");

    const payload = {
      fichas,
      notas,
      atualizadoEm: new Date().toISOString()
    };

    const res = await fetch(`https://api.jsonbin.io/v3/b/${bId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": mKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Erro HTTP ${res.status} ao salvar na nuvem.`);
    }

    this.salvarCredenciais(bId, mKey);
    return { fichasQtd: fichas.length, notasQtd: notas.length };
  },

  /**
   * Baixa e restaura fichas e anotações do JSONBin.io
   */
  async baixarNuvem(binId, masterKey) {
    const bId = binId || this.obterCredenciais().binId;
    const mKey = masterKey || this.obterCredenciais().masterKey;

    if (!bId || !mKey) {
      throw new Error("Preencha o Bin ID e a Master Key antes de baixar.");
    }

    const res = await fetch(`https://api.jsonbin.io/v3/b/${bId}/latest`, {
      method: "GET",
      headers: {
        "X-Master-Key": mKey
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Erro HTTP ${res.status} ao baixar da nuvem.`);
    }

    const data = await res.json();
    const record = data.record || {};

    const fichas = Array.isArray(record.fichas) ? record.fichas : [];
    const notas = Array.isArray(record.notas) ? record.notas : [];

    localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
    localStorage.setItem(STORAGE_KEYS.NOTAS, JSON.stringify(notas));
    this.salvarCredenciais(bId, mKey);

    // Se o usuário for Mestre, replica imediatamente para o Room Metadata e Broadcast
    try {
      const role = await OBR.player.getRole();
      if (role === "GM") {
        await SolariaSync.sincronizarFichasComSala(fichas);
        await SolariaSync.sincronizarNotasComSala(notas);
      }
      await OBR.broadcast.sendMessage("solaria/ficha-sync", fichas[0] || {});
      await OBR.broadcast.sendMessage("solaria/nota-sync", notas[0] || {});
    } catch (_) {}

    return { fichasQtd: fichas.length, notasQtd: notas.length };
  }
};

/**
 * Conecta os elementos da interface do index.html ao módulo da nuvem
 */
export function configurarInterfaceNuvem() {
  const inpBinId = document.getElementById("cloud-bin-id");
  const inpKey = document.getElementById("cloud-master-key");
  const btnSalvar = document.getElementById("btn-salvar-nuvem");
  const btnBaixar = document.getElementById("btn-baixar-nuvem");
  const statusEl = document.getElementById("cloud-status");

  if (!inpBinId || !inpKey || !btnSalvar || !btnBaixar) return;

  const creds = SolariaCloud.obterCredenciais();
  inpBinId.value = creds.binId;
  inpKey.value = creds.masterKey;

  const salvarInputs = () => {
    SolariaCloud.salvarCredenciais(inpBinId.value, inpKey.value);
  };

  inpBinId.addEventListener("input", salvarInputs);
  inpKey.addEventListener("input", salvarInputs);

  function exibirStatus(msg, cor = "#7982a9") {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = cor;
    }
  }

  btnSalvar.addEventListener("click", async () => {
    try {
      exibirStatus("Salvando na nuvem...", "#e0af68");
      btnSalvar.disabled = true;

      const res = await SolariaCloud.salvarNuvem(inpBinId.value, inpKey.value);
      exibirStatus(`Salvo! (${res.fichasQtd} fichas, ${res.notasQtd} notas)`, "#9ece6a");

      try {
        OBR.notification.show("Backup salvo na nuvem com sucesso! ☁️");
      } catch (_) {}
    } catch (err) {
      exibirStatus(err.message, "#f7768e");
    } finally {
      btnSalvar.disabled = false;
    }
  });

  btnBaixar.addEventListener("click", async () => {
    try {
      exibirStatus("Baixando da nuvem...", "#e0af68");
      btnBaixar.disabled = true;

      const res = await SolariaCloud.baixarNuvem(inpBinId.value, inpKey.value);
      exibirStatus(`Restaurado: ${res.fichasQtd} fichas, ${res.notasQtd} notas!`, "#9ece6a");

      try {
        OBR.notification.show("Dados restaurados da nuvem com sucesso! 📥");
      } catch (_) {}
    } catch (err) {
      exibirStatus(err.message, "#f7768e");
    } finally {
      btnBaixar.disabled = false;
    }
  });
}