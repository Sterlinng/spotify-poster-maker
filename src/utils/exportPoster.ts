import { toPng } from "html-to-image";

export async function exportPosterPNG(ref: React.RefObject<HTMLDivElement>) {
  if (!ref.current) return;

  await (document as Document & { fonts: FontFaceSet }).fonts.ready;

  // Génère un canvas de bruit
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = 100;
  noiseCanvas.height = 100;
  const ctx = noiseCanvas.getContext("2d");

  if (ctx) {
    const imageData = ctx.createImageData(100, 100);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const shade = Math.random() * 255;
      imageData.data[i] = shade;
      imageData.data[i + 1] = shade;
      imageData.data[i + 2] = shade;
      imageData.data[i + 3] = 40;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const noiseURL = noiseCanvas.toDataURL("image/png");

  const grainBake = document.getElementById("grain-bake");
  if (grainBake) {
    grainBake.style.backgroundImage = `url(${noiseURL})`;
    grainBake.style.display = "block";
  }

  // Snapshot
  const dataUrl = await toPng(ref.current, {
    cacheBust: true,
    pixelRatio: 4,
  });

  // Clean up
  if (grainBake) {
    grainBake.style.display = "none";
    grainBake.style.backgroundImage = "";
  }

  // Téléchargement
  const link = document.createElement("a");
  link.download = "poster.png";
  link.href = dataUrl;
  link.click();
}
