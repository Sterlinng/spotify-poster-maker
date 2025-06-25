import { useState } from "react";
import Poster from "@/components/poster/Poster";
import OptionsPanel from "@/components/options/OptionsPanel";

export default function Main() {
  const [albumId, setAlbumId] = useState("748dZDqSZy6aPXKcI9H80u");

  return (
    <main className="flex flex-col md:flex-row bg-spotify-black flex-grow p-4 gap-6 items-center md:items-start justify-center md:justify-center">
      <Poster albumId={albumId} />
      <OptionsPanel onAlbumSelect={setAlbumId} />
    </main>
  );
}
