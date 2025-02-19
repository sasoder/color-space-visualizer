import { useState, useCallback } from "react";
import { RGBCube } from "@/components/RGBCube";
import { ColorControls } from "@/components/ColorControls";
import { SavedColorsList } from "@/components/SavedColorsList";
import { SavedColor, ColorMode, RGB } from "@/types/color";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Index() {
  // Initialize with a default point
  const [savedColors, setSavedColors] = useState<SavedColor[]>([
    {
      id: "initial",
      type: "point",
      rgb: [127, 127, 127],
    },
  ]);
  const [selectedId, setSelectedId] = useState("initial");

  // The current color mode is determined by the selected color's type
  const selectedColor = savedColors.find((c) => c.id === selectedId);
  const currentMode: ColorMode = selectedColor?.type || "point";

  const handleColorChange = useCallback(
    (newRgb: RGB) => {
      setSavedColors((colors) =>
        colors.map((color) =>
          color.id === selectedId && color.type === "point"
            ? { ...color, rgb: newRgb }
            : color
        )
      );
    },
    [selectedId]
  );

  const handleAddNewPoint = useCallback(() => {
    const newPoint = {
      id: `point-${Date.now()}`,
      type: "point" as const,
      rgb: [127, 127, 127] as RGB,
    };
    setSavedColors((colors) => [...colors, newPoint]);
    setSelectedId(newPoint.id);
  }, []);

  const handleRemoveColor = useCallback(
    (id: string) => {
      setSavedColors((colors) => {
        const newColors = colors.filter((c) => c.id !== id);
        if (id === selectedId && newColors.length > 0) {
          setSelectedId(newColors[0].id);
        }
        return newColors;
      });
    },
    [selectedId]
  );

  const currentRgb: RGB =
    selectedColor?.type === "point" ? selectedColor.rgb : [127, 127, 127];

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-foreground">
        Color Space Visualization
      </h1>

      <div className="grid grid-cols-4 gap-4 flex-grow">
        <div className="flex flex-col gap-4">
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Saved Colors</h2>
              <Button size="sm" onClick={handleAddNewPoint}>
                <Plus className="h-4 w-4 mr-1" />
                Add Point
              </Button>
            </div>
            <SavedColorsList
              colors={savedColors}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={handleRemoveColor}
            />
          </div>
        </div>

        <div className="col-span-3 grid grid-cols-3 gap-4">
          <div className="aspect-square bg-card rounded-lg overflow-hidden shadow-lg">
            <RGBCube
              rgb={currentRgb}
              savedColors={savedColors}
              selectedId={selectedId}
            />
          </div>
          <div className="aspect-square bg-card rounded-lg overflow-hidden shadow-lg">
            {/* HLS Double-Cone will go here */}
          </div>
          <div className="aspect-square bg-card rounded-lg overflow-hidden shadow-lg">
            {/* HSV Cone will go here */}
          </div>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-lg">
        <ColorControls rgb={currentRgb} onChange={handleColorChange} />
      </div>
    </div>
  );
}
