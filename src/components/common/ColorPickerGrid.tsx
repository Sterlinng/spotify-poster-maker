import { Button } from "../ui/button";

export function ColorPickerGrid({
  palette,
  activeColors,
  onToggleColor,
}: {
  palette: string[];
  activeColors: number[];
  onToggleColor: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {palette.map((color, i) => (
        <Button
          key={i}
          variant="outline"
          size="icon"
          onClick={() => onToggleColor(i)}
          className={`w-8 h-8 rounded-full p-0 border-2 ${
            activeColors.includes(i) ? "border-white" : "border-transparent"
          }`}
          style={{
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}
