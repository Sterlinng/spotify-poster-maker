import { toPng } from "html-to-image";

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

  {
    const imgs = Array.from(node.querySelectorAll("img")).map((img, i) => ({
      i,
      src: img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
    }));
    const blurDiv = node.querySelector(
      ".absolute.inset-0.z-0.scale-\\[1\\.2\\]"
    );
    const bg = blurDiv
      ? getComputedStyle(blurDiv as HTMLElement).backgroundImage
      : "blur div non trouvée";

    alert(
      "DEBUG exportPosterPNG\n\n" +
        "Images:\n" +
        JSON.stringify(imgs, null, 2) +
        "\n\nBlur background:\n" +
        bg
    );
  }

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const pr = isMobile ? 2 : 3;

  const dataUrl = await toPng(node, {
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

  if (grainBake) {
    grainBake.style.display = "none";
    grainBake.style.backgroundImage = "";
  }

  const resp = await fetch(dataUrl);
  return resp.blob();
}
