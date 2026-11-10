import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { Estado } from "./estado.js";

const ID_PAINEL = "solaria-painel-inferior-direito";

export async function aplicarDimensoes(largura, altura) {
  const w = Math.max(340, Math.min(largura, window.screen.width - 40));
  const h = Math.max(400, Math.min(altura, window.screen.height - 100));

  Estado.dimensoes = { width: w, height: h };
  localStorage.setItem("solaria_painel_dimensoes", JSON.stringify(Estado.dimensoes));

  try {
    await OBR.popover.setWidth(ID_PAINEL, Math.round(w));
    await OBR.popover.setHeight(ID_PAINEL, Math.round(h));
  } catch (_) {}
}

export function configurarArrasto() {
  const elTop = document.getElementById("resize-top");
  const elLeft = document.getElementById("resize-left");
  const elCorner = document.getElementById("resize-corner");

  function iniciarRedimensionamento(e, redimensionaW, redimensionaH) {
    e.preventDefault();
    const startX = e.screenX;
    const startY = e.screenY;
    const startW = Estado.dimensoes.width;
    const startH = Estado.dimensoes.height;

    const onPointerMove = (ev) => {
      let novoW = startW;
      let novoH = startH;

      if (redimensionaW) {
        novoW = startW + (startX - ev.screenX);
      }
      if (redimensionaH) {
        novoH = startH + (startY - ev.screenY);
      }

      aplicarDimensoes(novoW, novoH);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  elTop?.addEventListener("pointerdown", (e) => iniciarRedimensionamento(e, false, true));
  elLeft?.addEventListener("pointerdown", (e) => iniciarRedimensionamento(e, true, false));
  elCorner?.addEventListener("pointerdown", (e) => iniciarRedimensionamento(e, true, true));

  const btnPreset = document.getElementById("btn-toggle-size");
  const presets = [
    { label: "📐 Médio", width: 480, height: 680 },
    { label: "📐 Amplo", width: 660, height: 760 },
    { label: "📐 Max", width: 860, height: 860 }
  ];
  let presetIdx = 0;

  btnPreset?.addEventListener("click", () => {
    presetIdx = (presetIdx + 1) % presets.length;
    const p = presets[presetIdx];
    btnPreset.textContent = p.label;
    aplicarDimensoes(p.width, p.height);
  });
}