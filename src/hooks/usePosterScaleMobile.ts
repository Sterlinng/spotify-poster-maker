import { useLayoutEffect, useState } from "react";

export function usePosterScaleMobile(ref: React.RefObject<HTMLElement>) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;

      const w = el.clientWidth;
      const h = el.clientHeight || window.innerHeight;

      const s = Math.min(1, (w * 0.6) / 600, (h * 0.6) / 850);
      setScale(s);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);

  return scale;
}
