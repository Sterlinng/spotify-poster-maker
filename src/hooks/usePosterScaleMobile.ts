import { useLayoutEffect, useState } from "react";

export function usePosterScaleMobile() {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      const vw = Math.min(
        window.innerWidth,
        document.documentElement.clientWidth
      );
      const vh = Math.min(
        window.innerHeight,
        document.documentElement.clientHeight
      );

      const s = Math.min(1, (vw * 0.9) / 600, (vh * 0.9) / 850);
      setScale(s);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return scale;
}
