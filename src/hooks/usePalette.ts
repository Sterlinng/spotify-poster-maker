import { useState, useEffect } from "react";

const bucket = (v: number) => Math.round(v / 32) * 32;

function rgbaToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

export function usePalette(url: string | undefined, count = 5): string[] {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    if (!url) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      const w = 50,
        h = 50;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const map = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = bucket(data[i]);
        const g = bucket(data[i + 1]);
        const b = bucket(data[i + 2]);
        const key = `${r}-${g}-${b}`;
        map.set(key, (map.get(key) || 0) + 1);
      }

      const top = [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map((e) => {
          const [r, g, b] = e[0].split("-").map(Number);
          return rgbaToHex(r, g, b);
        });

      setColors(top);
    };

    img.onerror = () => setColors([]);
  }, [url, count]);

  return colors;
}
