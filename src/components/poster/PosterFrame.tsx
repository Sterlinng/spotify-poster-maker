import { useRef } from "react";
import Poster from "../poster/Poster";
import type { PosterProps } from "../poster/Poster";
import { usePosterScaleMobile } from "../../hooks/usePosterScaleMobile";
import { useIsDesktop } from "../../hooks/useIsDesktop";

export default function PosterFrame({
  exportRef,
  ...props
}: PosterProps & { exportRef: React.RefObject<HTMLDivElement> }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop(768);
  // @ts-expect-error: HTMLDivElement is assignable to HTMLElement
  const scaleMobile = usePosterScaleMobile(frameRef);

  const scale = isDesktop ? 1 : scaleMobile;

  return (
    <div
      ref={frameRef}
      className="relative flex-shrink-0"
      style={{
        width: 600 * scale,
        height: 850 * scale,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
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
