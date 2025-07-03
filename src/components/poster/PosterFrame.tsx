import { useRef } from "react";
import Poster from "@/components/poster/Poster";
import type { PosterProps } from "@/components/poster/Poster";
import { usePosterScaleMobile } from "@/hooks/usePosterScaleMobile";
import { useIsDesktop } from "@/hooks/useIsDesktop";

export default function PosterFrame(props: PosterProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop(768);
  const scaleMobile = usePosterScaleMobile(frameRef);

  const scale = isDesktop ? 1 : scaleMobile;

  return (
    <div
      ref={frameRef}
      className="relative flex-shrink-0"
      style={{
        width: 600 * scale,
        height: 850 * scale,
      }}
    >
      <div
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
