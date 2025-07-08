import { useState, useEffect, useRef } from "react";
import OptionsPanel from "../options/OptionsPanel";
import PosterFrame from "../poster/PosterFrame";
import { exportPosterPNG } from "../../utils/exportPoster";

export default function Main() {
  const [albumId, setAlbumId] = useState("4SZko61aMnmgvNhfhgTuD3");
  const [grain, setGrain] = useState(0);
  const [blur, setBlur] = useState(25);
  const [palette, setPalette] = useState<string[]>([]);
  const exportRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  const [activeColors, setActiveColors] = useState<number[]>([]);
  useEffect(() => {
    setActiveColors(palette.map((_, i) => i));
  }, [palette]);

  return (
    <main className="flex flex-col md:flex-row bg-spotify-black flex-grow p-4 gap-6 items-center md:items-start justify-center md:justify-center">
      <PosterFrame
        albumId={albumId}
        grain={grain}
        blur={blur}
        setPalette={setPalette}
        activeColors={activeColors}
        exportRef={exportRef}
      />
      <OptionsPanel
        onAlbumSelect={setAlbumId}
        grain={grain}
        onGrainChange={setGrain}
        blur={blur}
        onBlurChange={setBlur}
        palette={palette}
        activeColors={activeColors}
        onToggleColor={(i) => {
          if (activeColors.includes(i)) {
            setActiveColors(activeColors.filter((c) => c !== i));
          } else {
            setActiveColors([...activeColors, i]);
          }
        }}
        onExport={() => exportPosterPNG(exportRef)}
      />
    </main>
  );
}
