import { toPng, toCanvas } from "html-to-image";

async function convertImageToDataURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to data URL:", error);
    return url;
  }
}

function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img"));
  const unloaded = images.filter((img) => !img.complete);

  if (unloaded.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let loaded = 0;
    unloaded.forEach((img) => {
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === unloaded.length) resolve();
      };
    });
  });
}

export async function exportPosterPNG(
  ref: React.RefObject<HTMLDivElement>,
  scale: number
): Promise<Blob> {
  if (!ref.current) return Promise.reject(new Error("Ref non défini"));

  await (document as Document & { fonts: FontFaceSet }).fonts.ready;

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // Convertir toutes les images en data URLs pour éviter les problèmes CORS sur mobile
  const images = Array.from(ref.current.querySelectorAll("img"));
  const originalSrcs: string[] = [];

  console.log(`[Export] Found ${images.length} images to process`);

  for (let i = 0; i < images.length; i++) {
    const img = images[i] as HTMLImageElement;
    originalSrcs[i] = img.src;

    console.log(`[Export] Image ${i}: src starts with data: ${img.src.substring(0, 20)}...`);
    console.log(`[Export] Image ${i}: complete = ${img.complete}, naturalWidth = ${img.naturalWidth}`);

    // Si l'image n'est pas déjà une data URL ou est vide, la convertir
    if (img.src && !img.src.startsWith("data:")) {
      try {
        console.log(`[Export] Converting image ${i} to data URL`);
        const dataURL = await convertImageToDataURL(img.src);
        img.src = dataURL;
        // Forcer le rechargement de l'image
        await new Promise((resolve) => {
          if (img.complete) {
            resolve(null);
          } else {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
          }
        });
        console.log(`[Export] Image ${i} converted successfully`);
      } catch (error) {
        console.error(`[Export] Error converting image ${i}:`, error);
      }
    } else {
      console.log(`[Export] Image ${i} is already a data URL`);
    }
  }

  // Attendre un peu plus pour s'assurer que tout est rendu
  await new Promise((resolve) => setTimeout(resolve, isMobile ? 500 : 300));
  await waitForImagesToLoad(ref.current);

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
  const rect = node.getBoundingClientRect();

  const pr = isMobile ? 3 : 4;

  let dataUrl: string;

  if (isMobile) {
    // Sur mobile, utiliser toCanvas puis convertir en PNG pour plus de fiabilité
    const canvas = await toCanvas(node, {
      cacheBust: true,
      pixelRatio: pr,
      width: rect.width / scale,
      height: rect.height / scale,
      filter: (n) =>
        !(n.tagName === "LINK" && n.getAttribute("rel") === "stylesheet"),
      style: {
        width: `${rect.width / scale}px`,
        height: `${rect.height / scale}px`,
        transform: "none",
        transformOrigin: "top left",
      },
      backgroundColor: "#000",
    });

    dataUrl = canvas.toDataURL("image/png", 1.0);
  } else {
    dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: pr,
      width: rect.width / scale,
      height: rect.height / scale,
      filter: (n) =>
        !(n.tagName === "LINK" && n.getAttribute("rel") === "stylesheet"),
      style: {
        width: `${rect.width / scale}px`,
        height: `${rect.height / scale}px`,
        transform: "none",
        transformOrigin: "top left",
      },
      backgroundColor: "#000",
    });
  }

  // Restaurer les URLs originales des images
  for (let i = 0; i < images.length; i++) {
    const img = images[i] as HTMLImageElement;
    img.src = originalSrcs[i];
  }

  if (grainBake) {
    grainBake.style.display = "none";
    grainBake.style.backgroundImage = "";
  }

  const resp = await fetch(dataUrl);
  return resp.blob();
}
