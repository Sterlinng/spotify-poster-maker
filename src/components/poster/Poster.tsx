import { useEffect, useMemo, useState } from "react";
import { useSpotifyAlbum } from "../../hooks/useSpotifyAlbum";
import { usePalette } from "../../hooks/usePalette";

export type PosterProps = {
  albumId: string;
  grain: number;
  blur: number;
  setPalette: (palette: string[]) => void;
  activeColors: number[];
};

export default function Poster({
  albumId,
  grain,
  blur,
  setPalette,
  activeColors,
}: PosterProps) {
  const album = useSpotifyAlbum(albumId);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!album?.coverUrl) return;

    setCoverDataUrl(null);

    (async () => {
      try {
        const res = await fetch(album.coverUrl);
        const blob = await res.blob();
        const bmp = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        canvas.getContext("2d")!.drawImage(bmp, 0, 0);
        setCoverDataUrl(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        console.error(err);
        setCoverDataUrl(album.coverUrl);
      }
    })();
  }, [album?.coverUrl]);

  const palette = usePalette(coverDataUrl || undefined);

  useEffect(() => {
    if (palette?.length) {
      setPalette(palette);
    }
  }, [palette, setPalette]);

  const MAX_VISIBLE_TRACKS = 20;
  const MAX_LINES = 10;
  const MAX_COLS = 2;

  const visibleTracks = useMemo(
    () => (album ? album.tracklist.slice(0, MAX_VISIBLE_TRACKS) : []),
    [album]
  );
  const plusTracks = album ? album.tracklist.length - MAX_VISIBLE_TRACKS : 0;

  const cols =
    Math.min(MAX_COLS, Math.ceil(visibleTracks.length / MAX_LINES)) || 1;
  const perCol = Math.ceil(visibleTracks.length / cols) || 1;
  const columns = useMemo(
    () =>
      Array.from({ length: cols }, (_, i) =>
        visibleTracks.slice(i * perCol, (i + 1) * perCol)
      ),
    [visibleTracks, cols, perCol]
  );

  if (!album) return <p>Loading album…</p>;

  const lineH = 14;
  const baseFont = 12;
  const AVAILABLE_PX = 226;
  const needPx = Math.ceil(visibleTracks.length / cols) * lineH;
  const trackFont = Math.max(
    9,
    Math.min(baseFont, (baseFont * AVAILABLE_PX) / needPx)
  );

  const formattedDate = new Date(album.releaseDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <div
      className="relative border border-white/20 flex flex-col items-center font-display overflow-hidden"
      style={{
        width: 600,
        height: 850,
        paddingTop: 32,
        paddingBottom: 48,
        backgroundColor: "#000",
      }}
    >
      <div className="absolute inset-0 z-0 scale-[1.2] opacity-40 overflow-hidden">
        <img
          src={coverDataUrl || ""}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `blur(${20 + blur}px)`,
          }}
        />
      </div>

      <div className="absolute inset-0 z-0 bg-black/40" />

      <div
        className="absolute inset-0 z-50 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='grain'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='5' stitchTiles='stitch'/><feColorMatrix type='matrix' values='-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23grain)'/></svg>")`,
          backgroundRepeat: "repeat",
          backgroundSize: "100px 100px",
          opacity: (grain / 100) * 0.4,
          mixBlendMode: "screen",
        }}
      />
      <div
        id="grain-bake"
        className="absolute inset-0 z-50 pointer-events-none"
        style={{
          backgroundRepeat: "repeat",
          backgroundSize: "100px 100px",
          opacity: (grain / 100) * 0.4,
          display: "none",
        }}
      />

      <div
        className="relative z-40 text-white flex flex-col items-start"
        style={{ width: 500, marginBottom: 16 }}
      >
        <h1
          className="font-black font-infra uppercase break-words leading-tight"
          style={{ fontSize: 30, letterSpacing: -0.5 }}
        >
          {album.name}
        </h1>

        <div className="flex items-center justify-between w-full mt-[-6px]">
          <h2
            className="font-light font-infra uppercase break-words leading-tight"
            style={{ fontSize: 18 }}
          >
            {album.artist}
          </h2>

          {palette.length > 0 && (
            <div className="flex gap-[6px]">
              {activeColors.map((index) => (
                <div
                  key={index}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: palette[index],
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-40 w-[500px] h-[500px] mt-[-10px]">
        <img
          src={coverDataUrl || ""}
          alt={album.name}
          className="w-full h-full object-cover rounded-[4px]"
        />
      </div>

      {/* <img> caché pour forcer html-to-image à charger l'image background */}
      <img src={coverDataUrl || ""} style={{ display: "none" }} alt="" />

      <div
        className="relative z-40 flex justify-between items-start w-full px-[50px] mt-2"
        style={{ fontSize: trackFont }}
      >
        <div
          className="flex flex-col font-infra font-light leading-[1.1]"
          style={{ width: 320 }}
        >
          <div className="flex gap-[6px]">
            {columns.map((col, c) => (
              <div key={c} className="flex flex-col gap-0 flex-1">
                {col.map((t: string, i: number) => {
                  const isLastVisible =
                    c === columns.length - 1 &&
                    i === col.length - 1 &&
                    plusTracks > 0;
                  return (
                    <div key={i} className="flex flex-col">
                      <div className="flex">
                        <span
                          className="font-bold text-white mr-1 flex-shrink-0"
                          style={{ minWidth: 20, textAlign: "right" }}
                        >
                          {c * perCol + i + 1}.
                        </span>
                        <span className="text-spotify-gray">{t}</span>
                      </div>
                      {isLastVisible && (
                        <span className="text-spotify-gray text-[10px] mt-[4px] italic opacity-70">
                          + {plusTracks} more tracks
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col items-end font-infra text-white"
          style={{ fontSize: 12 }}
        >
          <div className="flex flex-col items-end mb-2">
            <span className="font-bold">Release date</span>
            <span className="text-spotify-gray text-[11px] font-light">
              {formattedDate}
            </span>
          </div>

          <div className="flex flex-col items-end mb-2">
            <span className="font-bold">Album length</span>
            <span className="text-spotify-gray text-[11px] font-light">
              {album.albumLength} ({album.tracklist.length} tracks)
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-bold">Label</span>
            <span
              className="text-spotify-gray text-[11px] font-light text-right whitespace-pre-wrap break-words"
              style={{ maxWidth: 180 }}
            >
              {album.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
