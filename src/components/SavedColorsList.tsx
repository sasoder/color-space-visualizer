import { SavedColor } from "@/types/color";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SavedColorsListProps {
  colors: SavedColor[];
  selectedId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SavedColorsList({
  colors,
  selectedId,
  onSelect,
  onRemove,
}: SavedColorsListProps) {
  return (
    <div className="space-y-3">
      {colors.map((color) => {
        const isSelected = color.id === selectedId;
        const bgColor =
          color.type === "point"
            ? `rgb(${color.rgb.join(",")})`
            : `linear-gradient(to right, rgb(${color.startRgb.join(
                ","
              )}), rgb(${color.endRgb.join(",")}))`;

        return (
          <div
            key={color.id}
            className={`
              flex items-center gap-3 p-2 cursor-pointer border
              ${
                isSelected
                  ? "border-black"
                  : "border-transparent hover:border-black/20"
              }
              transition-colors duration-150
            `}
            onClick={() => onSelect(color.id)}
          >
            <div
              className="w-6 h-6 border border-black/10"
              style={{ background: bgColor }}
            />
            <span className="flex-grow font-normal">
              {color.type === "point" ? "Point" : "Volume"}{" "}
              {color.id.slice(0, 4)}
            </span>
            {colors.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 "
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(color.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
