import { SavedColor } from "@/types/color";
import { Button } from "@/components/ui/button";
import { X, CopyPlus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { rgbToHls, rgbToHsv } from "@/lib/color-utils";

interface SavedColorsListProps {
  colors: SavedColor[];
  selectedId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const ColorItem = ({
  color,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  color: SavedColor;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}) => {
  const bgColor = `rgb(${color.rgb.join(",")})`;
  const [h, l, s] = rgbToHls(color.rgb[0], color.rgb[1], color.rgb[2]);
  const [hv, sv, v] = rgbToHsv(color.rgb[0], color.rgb[1], color.rgb[2]);

  return (
    <div
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
        className="w-6 h-6  ml-2 border border-black/10"
        style={{ background: bgColor }}
      />
      <div className="flex-grow font-normal text-xs space-y-0.5">
        <div>RGB: {color.rgb.map((v) => v.toFixed(0)).join(", ")}</div>
        <div>HLS: {[h, l, s].map((v) => v.toFixed(0)).join(", ")}</div>
        <div>HSV: {[hv, sv, v].map((v) => v.toFixed(0)).join(", ")}</div>
      </div>
      <div className="flex gap-1">
        {color.type === "point" && !color.interpolated && (
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(color.id);
            }}
          >
            <CopyPlus className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          disabled={color.interpolated}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(color.id);
          }}
        >
          {!color.interpolated && <X className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export function SavedColorsList({
  colors,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
}: SavedColorsListProps) {
  const pointColors = colors.filter((c) => !c.interpolated);
  const interpolatedColors = colors.filter((c) => c.interpolated);

  return (
    <Accordion type="multiple" defaultValue={["points"]} className="space-y-4">
      <AccordionItem value="points" className="border-none ">
        <AccordionTrigger className="hover:no-underline py-0 border hover:border-black/20 border-transparent p-2">
          <span className="text-sm font-medium">Control Points</span>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          <div className="space-y-3">
            {pointColors.map((color) => (
              <ColorItem
                key={color.id}
                color={color}
                isSelected={color.id === selectedId}
                onSelect={onSelect}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {interpolatedColors.length > 0 && (
        <AccordionItem value="interpolated" className="border-none">
          <AccordionTrigger className="hover:no-underline py-0 border hover:border-black/20 border-transparent p-2">
            <span className="text-sm font-medium">Interpolated Points</span>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0">
            <div className="space-y-3">
              {interpolatedColors.map((color) => (
                <ColorItem
                  key={color.id}
                  color={color}
                  isSelected={color.id === selectedId}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onDuplicate={onDuplicate}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
