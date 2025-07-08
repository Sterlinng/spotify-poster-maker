import { toPng } from "html-to-image";

export async function exportPosterPNG(
  ref: React.RefObject<HTMLDivElement>,
  scale: number
) {
  if (!ref.current) return Promise.reject(new Error("Ref non defini"));
  await (document as Document & { fonts: FontFaceSet }).fonts.ready;

  // grain bake (idem)
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

  const node = ref.current;

  // Taille physique sans scale
  const rect = node.getBoundingClientRect();

  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 4,
    width: rect.width / scale, // Divise par ton scale dynamique
    height: rect.height / scale,
    style: {
      width: `${rect.width / scale}px`,
      height: `${rect.height / scale}px`,
      transform: "none",
      transformOrigin: "top left",
    },
    backgroundColor: "#000",
  });

  if (grainBake) {
    grainBake.style.display = "none";
    grainBake.style.backgroundImage = "";
  }

  const resp = await fetch(dataUrl);
  return resp.blob();
}
