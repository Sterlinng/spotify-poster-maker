import { useState, useEffect } from "react";

export type AlbumData = {
  name: string;
  artist: string;
  coverUrl: string;
  tracklist: string[];
  releaseDate: string;
  albumLength: string;
  spotifyUri: string;
  label: string;
};

export function useSpotifyAlbum(albumId: string) {
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Récupérer le token
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/.netlify/functions/token");
        const data = await res.json();
        if (data.access_token) {
          setToken(data.access_token);
        } else {
          console.error("Erreur token", data);
        }
      } catch (err) {
        console.error("Erreur fetch token", err);
      }
    }

    fetchToken();
  }, []);

  // Récupérer l'album
  useEffect(() => {
    if (!token || !albumId) return;

    async function fetchAlbum() {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/albums/${albumId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();

        if (data && !data.error) {
          setAlbum({
            name: data.name,
            artist: data.artists[0]?.name ?? "",
            coverUrl: data.images[0]?.url ?? "",
            tracklist: data.tracks.items.map(
              (track: { name: string }) => track.name
            ),
            releaseDate: data.release_date,
            albumLength: calcAlbumLength(data.tracks.items),
            spotifyUri: data.uri,
            label: data.copyrights?.[0]?.text ?? "",
          });
        } else {
          console.error("Erreur album", data);
        }
      } catch (err) {
        console.error("Erreur fetch album", err);
      }
    }

    fetchAlbum();
  }, [token, albumId]);

  return album;
}

type Track = {
  duration_ms: number;
};

function calcAlbumLength(tracks: Track[]): string {
  const totalMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
  const totalSec = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
