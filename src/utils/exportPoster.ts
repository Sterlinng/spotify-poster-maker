import html2canvas from "html2canvas";

// Fonction pour appliquer du grain sur un canvas
function applyGrain(
  canvas: HTMLCanvasElement,
  intensity: number
): HTMLCanvasElement {
  if (intensity === 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Appliquer le grain
  const grainIntensity = (intensity / 100) * 40; // Max 40 de variation

  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * grainIntensity;
    data[i] += grain; // R
    data[i + 1] += grain; // G
    data[i + 2] += grain; // B
    // Alpha reste inchangé
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function exportPosterPNG(
  ref: React.RefObject<HTMLDivElement>,
  scale: number,
  blurAmount: number,
  grainAmount: number
): Promise<Blob> {
  if (!ref.current) return Promise.reject(new Error("Ref non défini"));

  // Attendre que les polices soient chargées
  await (document as Document & { fonts: FontFaceSet }).fonts.ready;

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // Attendre que tout soit rendu
  await new Promise((resolve) => setTimeout(resolve, isMobile ? 800 : 500));

  const node = ref.current;
  const rect = node.getBoundingClientRect();

  console.log("[Export] Starting capture with blur:", blurAmount, "grain:", grainAmount);

  try {
    // Capturer le poster de base sans effets CSS complexes
    let canvas = await html2canvas(node, {
      allowTaint: true,
      useCORS: true,
      scale: isMobile ? 3 : 4,
      width: rect.width / scale,
      height: rect.height / scale,
      backgroundColor: "#000000",
      logging: false,
      imageTimeout: 15000,
      ignoreElements: (element) => {
        // Ignorer le grain ET l'image de fond pendant la capture (on va la redessiner avec blur)
        if (element.id === "grain-bake" || element.classList.contains("grain-svg")) {
          return true;
        }
        // Ignorer les images de fond (on va les redessiner avec blur)
        if (element.tagName === "IMG") {
          const img = element as HTMLImageElement;
          const parentDiv = img.parentElement;
          // L'image de fond est dans un div avec scale-[1.2]
          if (parentDiv && parentDiv.className.includes("scale-[1.2]")) {
            return true;
          }
        }
        return false;
      },
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

        // Supprimer les filtres CSS qui ne sont pas supportés
        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style && htmlEl.style.filter) {
            htmlEl.style.filter = "none";
          }
        });
      },
    });

    console.log("[Export] Base canvas created:", canvas.width, "x", canvas.height);

    // Post-traitement : appliquer le blur manuellement
    // On doit blur uniquement l'image de fond, donc on va faire différemment
    // On va créer un nouveau canvas composite

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext("2d");

    if (!finalCtx) {
      throw new Error("Could not get canvas context");
    }

    // 1. Récupérer l'image de couverture de l'album - chercher la première image du poster
    const allImages = Array.from(node.querySelectorAll("img"));
    console.log("[Export] Found", allImages.length, "images in poster");

    const coverImg = allImages.find(img => {
      const htmlImg = img as HTMLImageElement;
      return htmlImg.src && htmlImg.src.startsWith("data:image/");
    }) as HTMLImageElement | undefined;

    if (coverImg && coverImg.src) {
      console.log("[Export] Processing cover image with blur");
      console.log("[Export] Blur amount:", blurAmount);

      // Créer un canvas pour l'image de fond floutée
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = finalCanvas.width;
      bgCanvas.height = finalCanvas.height;
      const bgCtx = bgCanvas.getContext("2d", { willReadFrequently: false });

      if (bgCtx) {
        // Charger et dessiner l'image de fond
        const img = new Image();

        await new Promise<void>((resolve) => {
          img.onload = () => {
            console.log("[Export] Image loaded, dimensions:", img.width, "x", img.height);

            // Fond noir
            bgCtx.fillStyle = "#000";
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

            // Zone pour l'image de fond (scaled 1.2x, opacity 40%)
            const scaleFactor = 1.2;
            const imgWidth = bgCanvas.width * scaleFactor;
            const imgHeight = bgCanvas.height * scaleFactor;
            const offsetX = (bgCanvas.width - imgWidth) / 2;
            const offsetY = (bgCanvas.height - imgHeight) / 2;

            // Créer un canvas temporaire pour appliquer le blur
            const blurCanvas = document.createElement("canvas");
            blurCanvas.width = bgCanvas.width;
            blurCanvas.height = bgCanvas.height;
            const blurCtx = blurCanvas.getContext("2d", { willReadFrequently: false });

            if (blurCtx) {
              // Dessiner l'image sur le canvas temporaire
              blurCtx.drawImage(img, offsetX, offsetY, imgWidth, imgHeight);

              // Appliquer le filtre blur
              const blurPx = (20 + blurAmount) * (isMobile ? 0.5 : 0.667); // Ajuster pour la résolution
              console.log("[Export] Applying blur:", blurPx, "px");
              blurCtx.filter = `blur(${blurPx}px)`;
              blurCtx.drawImage(blurCanvas, 0, 0);
              blurCtx.filter = "none";

              // Dessiner le résultat avec opacité sur le fond
              bgCtx.globalAlpha = 0.4;
              bgCtx.drawImage(blurCanvas, 0, 0);
              bgCtx.globalAlpha = 1.0;

              // Overlay noir semi-transparent
              bgCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
              bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

              console.log("[Export] Background with blur ready");
            }

            resolve();
          };
          img.onerror = (err) => {
            console.error("[Export] Image load error:", err);
            resolve();
          };
          img.src = coverImg.src;
        });

        // Dessiner le fond flouté sur le canvas final
        finalCtx.drawImage(bgCanvas, 0, 0);
      }
    } else {
      console.warn("[Export] No cover image found!");
    }

    // 2. Dessiner le contenu principal par-dessus (sans le fond)
    finalCtx.drawImage(canvas, 0, 0);

    // 3. Appliquer le grain si nécessaire
    if (grainAmount > 0) {
      console.log("[Export] Applying grain");
      applyGrain(finalCanvas, grainAmount);
    }

    console.log("[Export] Final canvas ready");

    // Convertir en blob
    return new Promise((resolve, reject) => {
      finalCanvas.toBlob(
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
    console.error("[Export] Error:", error);
    throw error;
  }
}
