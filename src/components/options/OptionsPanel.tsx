import { useState, useEffect, useMemo } from "react";
import debounce from "lodash.debounce";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { ColorPickerGrid } from "../common/ColorPickerGrid";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { CheckCircle2Icon } from "lucide-react";

type Album = {
  id: string;
  name: string;
  artist: string;
  coverUrl: string;
};

type OptionsPanelProps = {
  onAlbumSelect: (id: string) => void;
  grain: number;
  onGrainChange: (value: number) => void;
  blur: number;
  onBlurChange: (value: number) => void;
  palette: string[];
  activeColors: number[];
  onToggleColor: (index: number) => void;
  onExport: () => Promise<Blob>;
};

export default function OptionsPanel({
  onAlbumSelect,
  grain,
  onGrainChange,
  blur,
  onBlurChange,
  palette,
  activeColors,
  onToggleColor,
  onExport,
}: OptionsPanelProps) {
  const [results, setResults] = useState<Album[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function fetchAlbums(query: string) {
    if (!query) {
      setResults([]);
      return;
    }
    const tokenRes = await fetch("/.netlify/functions/token");
    const { access_token: token } = await tokenRes.json();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}` +
        `&type=album&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.albums?.items) {
      type SpotifyAlbumItem = {
        id: string;
        name: string;
        artists: { name: string }[];
        images: { url: string }[];
      };
      setResults(
        (data.albums.items as SpotifyAlbumItem[]).map((a) => ({
          id: a.id,
          name: a.name,
          artist: a.artists[0]?.name ?? "",
          coverUrl: a.images[0]?.url ?? "",
        }))
      );
    }
  }

  const debouncedFetch = useMemo(() => debounce(fetchAlbums, 300), []);

  useEffect(() => {
    debouncedFetch(searchTerm);
    return () => {
      debouncedFetch.cancel();
    };
  }, [searchTerm, debouncedFetch]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      setOpen(true);
    }
  }, [searchTerm]);

  async function handleExport() {
    setIsExporting(true);
    setShowSuccess(false);
    setPreviewUrl(null);

    try {
      const blob = await onExport();
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);

      if (isMobile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
          setShowSuccess(true);
        };
        reader.readAsDataURL(blob);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "poster.png";
        a.click();
        URL.revokeObjectURL(url);
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="w-full md:w-[400px] bg-spotify-sidebar text-spotify-white p-6 rounded-lg flex flex-col gap-4">
      <h2 className="text-xl font-bold">Options</h2>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Choose your Album</span>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 text-base justify-start bg-spotify-black text-white overflow-hidden whitespace-nowrap truncate"
            >
              <span className="block truncate">
                {searchTerm || "Search Album or Artist"}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-[400px] max-h-[480px] overflow-auto p-4">
            <Input
              placeholder="Search for either an album or an artist"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setOpen(true)}
              className="mb-4 h-10 text-base"
            />
            {searchTerm && results.length === 0 ? (
              <div className="px-2 py-2 text-sm text-gray-400">
                Searching...
              </div>
            ) : (
              results.map((album) => (
                <DropdownMenuItem
                  key={album.id}
                  onSelect={() => {
                    setSearchTerm(`${album.name} — ${album.artist}`);
                    setOpen(false);
                    onAlbumSelect(album.id);
                  }}
                  className="flex items-center gap-4 py-3"
                >
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    className="w-12 h-12 rounded-sm object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold truncate">{album.name}</span>
                    <span className="text-sm text-gray-400 truncate">
                      {album.artist}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <span className="text-sm font-semibold">Add Grain</span>
        <Slider
          value={[grain]}
          max={100}
          step={1}
          onValueChange={(val: number[]) => onGrainChange(val[0])}
        />

        <span className="text-sm font-semibold">Blur Intensity</span>
        <Slider
          value={[blur]}
          min={0}
          max={50}
          step={1}
          onValueChange={(val: number[]) => onBlurChange(val[0])}
        />

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Colors</span>
          <span className="text-xs text-muted-foreground">
            Toggle colors to show or hide them on your poster (max 5).
          </span>
          <ColorPickerGrid
            palette={palette}
            activeColors={activeColors}
            onToggleColor={onToggleColor}
          />
          <div className="mt-6">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full h-12 text-base font-semibold bg-spotify-green hover:bg-green-600 text-black"
            >
              {isExporting ? "Exporting…" : "Export"}
            </Button>

            {previewUrl && (
              <div className="mt-4">
                <img src={previewUrl} alt="poster preview" className="w-full" />
                <p className="text-xs text-center mt-1">
                  Long-press the image to save it
                </p>
              </div>
            )}

            {showSuccess && (
              <div className="mt-4">
                <Alert>
                  <CheckCircle2Icon className="h-4 w-4" />
                  <AlertTitle>Poster exported!</AlertTitle>
                  <AlertDescription>
                    Your poster has been saved as a PNG.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-spotify-gray">
              <p>
                This site was built by{" "}
                <a
                  href="https://aminefodilcherif.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition"
                >
                  Amine
                </a>{" "}
                as a personal project. Not affiliated with Spotify.
              </p>
              <p className="mt-2">
                Like your poster?{" "}
                <a
                  href="https://ko-fi.com/aminefodilcherif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition"
                >
                  Buy me a coffee on Ko-fi
                </a>
                !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
