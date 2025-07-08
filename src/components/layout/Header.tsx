import logo from "../../assets/spotify-logo.svg";

export default function Header() {
  return (
    <header className="bg-spotify-black text-white p-4 flex items-center gap-4">
      <img src={logo} alt="Spotify logo" className="h-8 w-auto" />
      <span className="text-xl font-bold text-spotify-green">Poster Maker</span>
    </header>
  );
}
