import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ColorControlsProps {
  rgb: [number, number, number];
  onChange: (rgb: [number, number, number]) => void;
}

export const ColorControls = ({ rgb, onChange }: ColorControlsProps) => {
  const handleSliderChange = (index: number, value: number[]) => {
    const newRgb = [...rgb] as [number, number, number];
    newRgb[index] = value[0];
    onChange(newRgb);
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    onChange([r, g, b]);
  };

  // Convert RGB to hex for color picker
  const rgbToHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="space-y-4">
        <h3 className="font-semibold">RGB Controls</h3>
        <div className="space-y-2">
          <Label>Red</Label>
          <Slider
            value={[rgb[0]]}
            max={255}
            step={1}
            onValueChange={(value: number[]) => handleSliderChange(0, value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Green</Label>
          <Slider
            value={[rgb[1]]}
            max={255}
            step={1}
            onValueChange={(value: number[]) => handleSliderChange(1, value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Blue</Label>
          <Slider
            value={[rgb[2]]}
            max={255}
            step={1}
            onValueChange={(value: number[]) => handleSliderChange(2, value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">View Controls</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full">
            Reset Camera
          </Button>
          <Button variant="outline" className="w-full">
            Toggle Grid
          </Button>
          <Button variant="outline" className="w-full">
            Toggle Labels
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Color Picker</h3>
        <input
          type="color"
          className="w-full h-10 rounded cursor-pointer"
          value={rgbToHex(rgb[0], rgb[1], rgb[2])}
          onChange={handleColorPickerChange}
        />
      </div>
    </div>
  );
};
