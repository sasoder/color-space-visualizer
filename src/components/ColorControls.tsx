import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { rgbToHsl, rgbToHsv, hslToRgb, hsvToRgb } from "@/lib/color-utils";
import React from "react";
import { SketchPicker } from "react-color";
import { Separator } from "@/components/ui/separator";

interface ColorControlsProps {
  rgb: [number, number, number];
  onChange: (rgb: [number, number, number]) => void;
}

export const ColorControls = ({ rgb, onChange }: ColorControlsProps) => {
  const [previousHsl, setPreviousHsl] = React.useState(0);
  const [previousHsv, setPreviousHsv] = React.useState(0);

  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2], previousHsl);
  const [hv, sv, v] = rgbToHsv(rgb[0], rgb[1], rgb[2], previousHsv);

  React.useEffect(() => {
    if (s > 0) setPreviousHsl(h);
    if (sv > 0) setPreviousHsv(hv);
  }, [h, s, hv, sv]);

  const handleRgbChange = (index: number, value: number[]) => {
    const newRgb = [...rgb] as [number, number, number];
    newRgb[index] = value[0];
    onChange(newRgb);
  };

  const handleHslChange = (index: number, value: number[]) => {
    const newHsl = [h, s, l];
    newHsl[index] = value[0];
    onChange(hslToRgb(newHsl[0], newHsl[1], newHsl[2]));
  };

  const handleHsvChange = (index: number, value: number[]) => {
    const newHsv = [hv, sv, v];
    newHsv[index] = value[0];
    onChange(hsvToRgb(newHsv[0], newHsv[1], newHsv[2]));
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

  const handleColorPickerChange = (color: string) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    onChange([r, g, b]);
  };

  const paperSliderStyle =
    "hover:bg-black/5 rounded-sm [&_[role=slider]]:rounded-sm [&_[role=slider]]:border-black/20 [&_[role=slider]]:shadow-sm [&_[role=slider]]:hover:border-black/40 [&_[role=track]]:bg-black/10 [&_[role=range]]:bg-black/20";

  return (
    <div className="flex items-start gap-8">
      <div className="flex-1 flex gap-8">
        <div className="flex-1">
          <h3 className="text-xl font-normal mb-4">RGB</h3>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-sm font-normal">Red</Label>
              <Slider
                value={[rgb[0]]}
                max={255}
                step={1}
                onValueChange={(value: number[]) => handleRgbChange(0, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Green</Label>
              <Slider
                value={[rgb[1]]}
                max={255}
                step={1}
                onValueChange={(value: number[]) => handleRgbChange(1, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Blue</Label>
              <Slider
                value={[rgb[2]]}
                max={255}
                step={1}
                onValueChange={(value: number[]) => handleRgbChange(2, value)}
                className={paperSliderStyle}
              />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-normal mb-4">HSL</h3>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-sm font-normal">Hue</Label>
              <Slider
                value={[h]}
                max={360}
                step={1}
                onValueChange={(value: number[]) => handleHslChange(0, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Saturation</Label>
              <Slider
                value={[s]}
                max={100}
                step={1}
                onValueChange={(value: number[]) => handleHslChange(1, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Lightness</Label>
              <Slider
                value={[l]}
                max={100}
                step={1}
                onValueChange={(value: number[]) => handleHslChange(2, value)}
                className={paperSliderStyle}
              />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-normal mb-4">HSV</h3>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-sm font-normal">Hue</Label>
              <Slider
                value={[hv]}
                max={360}
                step={1}
                onValueChange={(value: number[]) => handleHsvChange(0, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Saturation</Label>
              <Slider
                value={[sv]}
                max={100}
                step={1}
                onValueChange={(value: number[]) => handleHsvChange(1, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Value</Label>
              <Slider
                value={[v]}
                max={100}
                step={1}
                onValueChange={(value: number[]) => handleHsvChange(2, value)}
                className={paperSliderStyle}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator orientation="vertical" className="flex-none border-black/10" />
      <div className="min-w-[200px]">
        <h3 className="text-xl font-normal mb-4">Color Picker</h3>
        <SketchPicker
          color={rgbToHex(rgb[0], rgb[1], rgb[2])}
          onChange={handleColorPickerChange}
          className="rounded-none"
        />
      </div>
    </div>
  );
};

export default ColorControls;
