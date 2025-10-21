import html2canvas from "html2canvas";

/**
 * Applique un effet de grain sur un canvas
 */
function applyGrainEffect(canvas: HTMLCanvasElement, intensity: number): void {
  if (intensity === 0) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Intensité du grain (0-100 -> 0-50 de variation)
  const grainAmount = (intensity / 100) * 50;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * grainAmount;
    data[i] += noise;     // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
    // Alpha inchangé
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Exporte le poster en PNG avec les effets blur et grain appliqués
 */
export async function exportPosterPNG(
  ref: React.RefObject<HTMLDivElement>,
  scale: number,
  blurAmount: number,
  grainAmount: number
): Promise<Blob> {
  if (!ref.current) {
    return Promise.reject(new Error("Ref non défini"));
  }

  console.log("[Export] Starting export with blur:", blurAmount, "grain:", grainAmount);

  // Attendre que les polices soient chargées
  await (document as Document & { fonts: FontFaceSet }).fonts.ready;

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // Délai pour s'assurer que tout est rendu
  await new Promise((resolve) => setTimeout(resolve, isMobile ? 1000 : 600));

  const node = ref.current;
  const rect = node.getBoundingClientRect();

  // Masquer le grain SVG pendant la capture (on l'appliquera après)
  const grainSvg = node.querySelector(".grain-svg") as HTMLElement;
  const originalGrainDisplay = grainSvg ? grainSvg.style.display : "";
  if (grainSvg) {
    grainSvg.style.display = "none";
  }

  try {
    // Capturer le poster tel quel avec html2canvas
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

    console.log("[Export] Canvas captured:", canvas.width, "x", canvas.height);

    // Restaurer le grain SVG
    if (grainSvg) {
      grainSvg.style.display = originalGrainDisplay;
    }

    // Appliquer le grain si nécessaire
    if (grainAmount > 0) {
      console.log("[Export] Applying grain effect");
      applyGrainEffect(canvas, grainAmount);
    }

    console.log("[Export] Export complete");

    // Convertir en blob
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
    // Restaurer le grain SVG en cas d'erreur
    if (grainSvg) {
      grainSvg.style.display = originalGrainDisplay;
    }
    console.error("[Export] Error:", error);
    throw error;
  }
}
