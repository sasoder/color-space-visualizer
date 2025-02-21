import { useState, useCallback, useEffect } from "react";
import { RGBCube } from "@/components/ThreeJS/RGBCube";
import { ColorControls } from "@/components/ColorControls";
import { SavedColorsList } from "@/components/SavedColorsList";
import { SavedColor, RGB, SavedPoint } from "@/types/color";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, RotateCcw, Grid, Grip } from "lucide-react";
import { HLSDiamond } from "@/components/ThreeJS/HLSDiamond";
import { HSVCone } from "@/components/ThreeJS/HSVCone";

export default function Index() {
  const [savedColors, setSavedColors] = useState<SavedColor[]>([
    {
      id: "initial",
      type: "point",
      rgb: [127, 127, 127],
      interpolated: false,
    },
  ]);
  const [selectedId, setSelectedId] = useState("initial");
  const [shouldResetViews, setShouldResetViews] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showInterpolation, setShowInterpolation] = useState(false);

  const handleResetAllViews = useCallback(() => {
    setShouldResetViews(true);
  }, []);

  const handleResetComplete = useCallback(() => {
    setShouldResetViews(false);
  }, []);

  // The current color mode is determined by the selected color's type
  const selectedColor = savedColors.find((c) => c.id === selectedId);

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
      interpolated: false,
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

  const handleDuplicateColor = useCallback((id: string) => {
    setSavedColors((colors) => {
      const colorToDuplicate = colors.find((c) => c.id === id);
      if (
        !colorToDuplicate ||
        colorToDuplicate.type !== "point" ||
        colorToDuplicate.interpolated
      ) {
        return colors;
      }
      const newPoint = {
        ...colorToDuplicate,
        id: `point-${Date.now()}`,
      };
      return [...colors, newPoint];
    });
  }, []);

  // Add interpolation points between two RGB colors
  const interpolatePoints = useCallback(
    (color1: RGB, color2: RGB, steps: number): RGB[] => {
      return Array.from({ length: steps }, (_, i) => {
        const t = i / (steps - 1);
        return [
          Math.round(color1[0] + t * (color2[0] - color1[0])),
          Math.round(color1[1] + t * (color2[1] - color1[1])),
          Math.round(color1[2] + t * (color2[2] - color1[2])),
        ] as RGB;
      });
    },
    []
  );

  // Update interpolation points whenever showInterpolation changes
  useEffect(() => {
    if (showInterpolation) {
      // Get non-interpolated points
      const basePoints = savedColors.filter(
        (c): c is SavedPoint => c.type === "point" && !c.interpolated
      );

      if (basePoints.length >= 2) {
        // Generate interpolated points between each pair
        const newPoints: SavedPoint[] = [];

        for (let i = 0; i < basePoints.length; i++) {
          for (let j = i + 1; j < basePoints.length; j++) {
            const interpolated = interpolatePoints(
              basePoints[i].rgb,
              basePoints[j].rgb,
              10 // Number of interpolation points including endpoints
            );

            // Add interpolated points (excluding endpoints)
            interpolated.slice(1, -1).forEach((rgb, index) => {
              newPoints.push({
                id: `interpolated-${basePoints[i].id}-${basePoints[j].id}-${index}`,
                type: "point",
                rgb,
                interpolated: true,
              });
            });
          }
        }

        // Update saved colors, keeping non-interpolated points
        setSavedColors((colors) => [
          ...colors.filter((c) => c.type === "point" && !c.interpolated),
          ...newPoints,
        ]);
      }
    } else {
      // Remove all interpolated points
      setSavedColors((colors) =>
        colors.filter((c) => c.type === "point" && !c.interpolated)
      );
    }
  }, [showInterpolation, interpolatePoints]);

  const currentRgb: RGB =
    selectedColor?.type === "point" ? selectedColor.rgb : [127, 127, 127];

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-none p-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-row items-center justify-center w-full gap-2">
              <h1 className="text-4xl font-normal text-black">
                Color Space Visualiser
              </h1>
              <img src="/favicon.png" alt="logo" className="w-10 h-10" />
            </div>
            <p className="text-sm text-gray-500">
              A visualisation of different color spaces. With the font Tinos.
            </p>
          </div>
        </header>

        <Separator className="flex-none border-black/10" />

        {/* Visualization Grid */}
        <div className="flex-1 min-h-0 relative">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetAllViews}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? "bg-black hover:bg-black/90" : ""}
            >
              <Grid
                className={`h-4 w-4 ${showGrid ? "text-white" : "text-black"}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInterpolation(!showInterpolation)}
              className={showInterpolation ? "bg-black hover:bg-black/90" : ""}
            >
              <Grip
                className={`h-4 w-4 ${
                  showInterpolation ? "text-white" : "text-black"
                }`}
              />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-0 h-full">
            <div className="w-full h-full">
              <RGBCube
                rgb={currentRgb}
                savedColors={savedColors}
                selectedId={selectedId}
                shouldReset={shouldResetViews}
                onResetComplete={handleResetComplete}
                showGrid={showGrid}
              />
            </div>
            <div className="w-full h-full">
              <HLSDiamond
                rgb={currentRgb}
                savedColors={savedColors}
                selectedId={selectedId}
                shouldReset={shouldResetViews}
                onResetComplete={handleResetComplete}
                showGrid={showGrid}
              />
            </div>
            <div className="w-full h-full">
              <HSVCone
                rgb={currentRgb}
                savedColors={savedColors}
                selectedId={selectedId}
                shouldReset={shouldResetViews}
                onResetComplete={handleResetComplete}
                showGrid={showGrid}
              />
            </div>
          </div>
        </div>

        <Separator className="flex-none border-black/10" />

        {/* Controls */}
        <div className="flex-none">
          <ColorControls rgb={currentRgb} onChange={handleColorChange} />
        </div>
      </div>

      <div className="flex-none">
        <Separator
          orientation="vertical"
          className="h-full border-black/10 p-0"
        />
      </div>

      <div className="w-80 flex-none p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-normal">Saved Colors</h2>
          <Button variant="outline" size="sm" onClick={handleAddNewPoint}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <SavedColorsList
          colors={savedColors}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={handleRemoveColor}
          onDuplicate={handleDuplicateColor}
        />
      </div>
    </div>
  );
}
