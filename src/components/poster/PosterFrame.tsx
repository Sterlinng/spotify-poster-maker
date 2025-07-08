import { usePosterScaleMobile } from "../../hooks/usePosterScaleMobile";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import Poster from "../poster/Poster";
import type { PosterProps } from "../poster/Poster";

export default function PosterFrame({
  exportRef,
  ...props
}: PosterProps & { exportRef: React.RefObject<HTMLDivElement> }) {
  const rawScale = usePosterScaleMobile();
  const isDesktop = useIsDesktop(768);
  const scale = isDesktop ? 1 : rawScale;

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: 600 * scale,
        height: 850 * scale,
      }}
    >
      <div
        ref={exportRef}
        className="flex items-center justify-center w-full h-full"
        style={{
          width: 600,
          height: 850,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Poster {...props} />
      </div>
    </div>
  );
}
