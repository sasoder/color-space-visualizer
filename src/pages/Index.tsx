import { useState, useCallback, useEffect } from "react";
import { RGBCube } from "@/components/ThreeJS/RGBCube";
import { ColorControls } from "@/components/ColorControls";
import { SavedColorsList } from "@/components/SavedColorsList";
import { SavedColor, RGB, SavedPoint } from "@/types/color";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, RotateCcw, Grid, Grip, Menu } from "lucide-react";
import { HLSDiamond } from "@/components/ThreeJS/HLSDiamond";
import { HSVCone } from "@/components/ThreeJS/HSVCone";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const handleRemoveColor = useCallback(
    (id: string) => {
      setSavedColors((colors) => {
        // First remove the point
        const newColors = colors.filter((c) => c.id !== id);
        if (id === selectedId && newColors.length > 0) {
          setSelectedId(newColors[0].id);
        }

        // If interpolation is enabled, update interpolated points
        if (showInterpolation) {
          const basePoints = newColors.filter(
            (c): c is SavedPoint => c.type === "point" && !c.interpolated
          );

          if (basePoints.length >= 2) {
            const newPoints: SavedPoint[] = [];

            for (let i = 0; i < basePoints.length; i++) {
              for (let j = i + 1; j < basePoints.length; j++) {
                const interpolated = interpolatePoints(
                  basePoints[i].rgb,
                  basePoints[j].rgb,
                  15
                );

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

            return [
              ...newColors.filter((c) => c.type === "point" && !c.interpolated),
              ...newPoints,
            ];
          }

          // If we have fewer than 2 points, turn off interpolation mode
          if (basePoints.length < 2) {
            setShowInterpolation(false);
          }
        }

        return newColors;
      });
    },
    [selectedId, showInterpolation, interpolatePoints, setShowInterpolation]
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

  const handleColorChange = useCallback(
    (newRgb: RGB) => {
      setSavedColors((colors) => {
        // First update the selected color
        const updatedColors = colors.map((color) =>
          color.id === selectedId && color.type === "point"
            ? { ...color, rgb: newRgb }
            : color
        );

        // If interpolation is enabled, update interpolated points
        if (showInterpolation) {
          const basePoints = updatedColors.filter(
            (c): c is SavedPoint => c.type === "point" && !c.interpolated
          );

          if (basePoints.length >= 2) {
            const newPoints: SavedPoint[] = [];

            for (let i = 0; i < basePoints.length; i++) {
              for (let j = i + 1; j < basePoints.length; j++) {
                const interpolated = interpolatePoints(
                  basePoints[i].rgb,
                  basePoints[j].rgb,
                  15
                );

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

            return [
              ...updatedColors.filter(
                (c) => c.type === "point" && !c.interpolated
              ),
              ...newPoints,
            ];
          }
        }

        return updatedColors;
      });
    },
    [selectedId, showInterpolation, interpolatePoints]
  );

  const handleAddNewPoint = useCallback(() => {
    const newPoint = {
      id: `point-${Date.now()}`,
      type: "point" as const,
      rgb: [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
      ] as RGB,
      interpolated: false,
    };
    setSavedColors((colors) => [...colors, newPoint]);
    setSelectedId(newPoint.id);
  }, []);

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
              15 // Number of interpolation points including endpoints
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
  }, [showInterpolation, interpolatePoints, savedColors]);

  const currentRgb: RGB =
    selectedColor?.type === "point" ? selectedColor.rgb : [127, 127, 127];

  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-none p-6">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex flex-row items-center justify-center w-full">
              <div className="flex items-center gap-2">
                <div className="text-2xl md:text-4xl font-normal text-black text-center">
                  Color Space Visualizer
                </div>
                <img
                  src="/favicon.png"
                  alt="logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 ml-1"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              A visualization of different color spaces. With the font Tinos.
            </p>
          </div>
        </header>

        <Separator />

        {/* Visualization Grid */}
        <div className="flex-1 min-h-0 flex flex-col relative lg:mr-[0.25px] md:mr-0">
          {/* Control Buttons */}
          <div className="flex-none absolute top-[72px] md:top-4 left-4 right-4 z-10 flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAllViews}
                className="border-transparent"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={`border-transparent ${
                  showGrid ? "bg-black hover:bg-black/90" : ""
                }`}
              >
                <Grid
                  className={`h-4 w-4 ${
                    showGrid ? "text-white" : "text-black"
                  }`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInterpolation(!showInterpolation)}
                className={`border-transparent ${
                  showInterpolation ? "bg-black hover:bg-black/90" : ""
                }`}
                disabled={
                  savedColors.filter(
                    (c) => c.type === "point" && !c.interpolated
                  ).length < 2
                }
              >
                <Grip
                  className={`h-4 w-4 ${
                    showInterpolation ? "text-white" : "text-black"
                  }`}
                />
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-transparent md:hidden text-sm"
                >
                  Add Color
                  <Plus className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] p-6 flex flex-col h-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-normal">Saved Colors</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddNewPoint}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="overflow-y-auto flex-1">
                  <SavedColorsList
                    colors={savedColors}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onRemove={handleRemoveColor}
                    onDuplicate={handleDuplicateColor}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Layout (3 columns) */}
          <div className="hidden md:grid grid-cols-3 gap-0 h-full">
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

          {/* Mobile Layout (Vertical Stack) */}
          <div className="md:hidden flex flex-col flex-1 min-h-0 pt-2">
            <Tabs defaultValue="rgb" className="flex flex-col flex-1 min-h-0">
              <TabsList className="flex-none grid grid-cols-3 w-full gap-2 px-8">
                <TabsTrigger value="rgb">RGB</TabsTrigger>
                <TabsTrigger value="hls">HLS</TabsTrigger>
                <TabsTrigger value="hsv">HSV</TabsTrigger>
              </TabsList>
              <Separator className="flex-none mt-2" />
              <div
                className="flex-1 min-h-0 relative"
                style={{ height: "calc(100vh - 300px)" }}
              >
                <TabsContent value="rgb" className="absolute inset-0 mt-0">
                  <RGBCube
                    rgb={currentRgb}
                    savedColors={savedColors}
                    selectedId={selectedId}
                    shouldReset={shouldResetViews}
                    onResetComplete={handleResetComplete}
                    showGrid={showGrid}
                  />
                </TabsContent>
                <TabsContent value="hls" className="absolute inset-0 mt-0">
                  <HLSDiamond
                    rgb={currentRgb}
                    savedColors={savedColors}
                    selectedId={selectedId}
                    shouldReset={shouldResetViews}
                    onResetComplete={handleResetComplete}
                    showGrid={showGrid}
                  />
                </TabsContent>
                <TabsContent value="hsv" className="absolute inset-0 mt-0">
                  <HSVCone
                    rgb={currentRgb}
                    savedColors={savedColors}
                    selectedId={selectedId}
                    shouldReset={shouldResetViews}
                    onResetComplete={handleResetComplete}
                    showGrid={showGrid}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <Separator className="flex-none" />

        {/* Controls */}
        <div className="flex-none">
          <ColorControls rgb={currentRgb} onChange={handleColorChange} />
        </div>
      </div>

      {/* Desktop Saved Colors Panel */}
      <div className="flex-none hidden md:block">
        <Separator orientation="vertical" className="h-full p-0" />
      </div>

      {/* Desktop Saved Colors List */}
      <div className="w-80 flex-none p-8 py-0 flex flex-col h-screen hidden md:flex">
        <div className="flex justify-between items-center mb-6 flex-none mt-6">
          <h2 className="text-2xl font-normal">Saved Colors</h2>
          <Button variant="outline" size="sm" onClick={handleAddNewPoint}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0">
          <SavedColorsList
            colors={savedColors}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRemove={handleRemoveColor}
            onDuplicate={handleDuplicateColor}
          />
        </div>
      </div>
    </div>
  );
}
