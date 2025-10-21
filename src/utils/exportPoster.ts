import html2canvas from "html2canvas";

export async function exportPosterPNG(
  ref: React.RefObject<HTMLDivElement>,
  scale: number
): Promise<Blob> {
  if (!ref.current) return Promise.reject(new Error("Ref non défini"));

  // Attendre que les polices soient chargées
  await (document as Document & { fonts: FontFaceSet }).fonts.ready;

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // Attendre un peu pour s'assurer que tout est rendu
  await new Promise((resolve) => setTimeout(resolve, isMobile ? 800 : 500));

  // Créer le canvas de grain et l'afficher
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

  console.log("[Export] Starting html2canvas capture...");
  console.log("[Export] isMobile:", isMobile);
  console.log("[Export] scale:", scale);
  console.log("[Export] rect:", rect);

  // Cacher les éléments normaux et afficher les versions export
  const hideElements = node.querySelectorAll(".export-hide");
  const showElements = node.querySelectorAll(".export-only");

  hideElements.forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });
  showElements.forEach((el) => {
    (el as HTMLElement).style.display = "block";
  });

  try {
    const canvas = await html2canvas(node, {
      allowTaint: true,
      useCORS: true,
      scale: isMobile ? 3 : 4,
      width: rect.width / scale,
      height: rect.height / scale,
      backgroundColor: "#000000",
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const clonedNode = clonedDoc.querySelector(
          `[data-export-ref="true"]`
        ) as HTMLElement;
        if (clonedNode) {
          clonedNode.style.width = `${rect.width / scale}px`;
          clonedNode.style.height = `${rect.height / scale}px`;
          clonedNode.style.transform = "none";
          clonedNode.style.transformOrigin = "top left";
        }
      },
    });

    console.log("[Export] Canvas created:", canvas.width, "x", canvas.height);

    // Restaurer l'affichage normal
    hideElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
    showElements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    // Cacher le grain
    if (grainBake) {
      grainBake.style.display = "none";
      grainBake.style.backgroundImage = "";
    }

    // Convertir le canvas en blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("[Export] Blob created, size:", blob.size);
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/png",
        1.0
      );
    });
  } catch (error) {
    // Restaurer l'affichage normal en cas d'erreur
    hideElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
    showElements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    // Cacher le grain en cas d'erreur
    if (grainBake) {
      grainBake.style.display = "none";
      grainBake.style.backgroundImage = "";
    }
    console.error("[Export] Error:", error);
    throw error;
  }
}
