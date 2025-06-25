import { useEffect, useMemo } from "react";
import { useSpotifyAlbum } from "@/hooks/useSpotifyAlbum";
import { usePalette } from "@/hooks/usePalette";

export default function Poster({ albumId }: { albumId: string }) {
  const album = useSpotifyAlbum(albumId);
  const palette = usePalette(album?.coverUrl);

  const MAX_VISIBLE_TRACKS = 20;
  const MAX_LINES = 10;
  const MAX_COLS = 2;

  const visibleTracks = useMemo(
    () => (album ? album.tracklist.slice(0, MAX_VISIBLE_TRACKS) : []),
    [album, MAX_VISIBLE_TRACKS]
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

  useEffect(() => {
    if (palette.length === 5) console.log("Palette:", palette);
  }, [palette]);

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
      <div
        className="absolute inset-0 z-0 blur-[50px] opacity-40 scale-[1.2]"
        style={{
          backgroundImage: `url(${album.coverUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute inset-0 z-0 bg-black/40" />

      <div
        className="relative z-10 text-white flex flex-col items-start"
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

          {palette.length === 5 && (
            <div className="flex gap-[6px]">
              {palette.map((c: string, i: number) => (
                <div
                  key={i}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: c,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 w-[500px] h-[500px] mt-[-10px]">
        <img
          src={album.coverUrl}
          alt={album.name}
          className="w-full h-full object-cover rounded-[4px]"
        />
      </div>

      <div
        className="relative z-10 flex justify-between items-start w-full px-[50px] mt-2"
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
                          className="font-bold text-white mr-1"
                          style={{ width: 18, textAlign: "right" }}
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
            <span className="text-spotify-gray text-[11px] font-light text-right w-full">
              {album.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
