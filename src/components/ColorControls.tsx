import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { rgbToHls, rgbToHsv, hlsToRgb, hsvToRgb } from "@/lib/color-utils";
import React from "react";
import { SketchPicker } from "react-color";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorControlsProps {
  rgb: [number, number, number];
  onChange: (rgb: [number, number, number]) => void;
}

export const ColorControls = ({ rgb, onChange }: ColorControlsProps) => {
  const [previousHsl, setPreviousHsl] = React.useState(0);
  const [previousHsv, setPreviousHsv] = React.useState(0);

  const [h, l, s] = rgbToHls(rgb[0], rgb[1], rgb[2], previousHsl);
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

  const handleHlsChange = (index: number, value: number[]) => {
    const newHls = [h, l, s];
    newHls[index] = value[0];
    onChange(hlsToRgb(newHls[0], newHls[1], newHls[2]));
  };

  const handleHsvChange = (index: number, value: number[]) => {
    const newHsv = [hv, sv, v];
    newHsv[index] = value[0];
    onChange(hsvToRgb(newHsv[0], newHsv[1], newHsv[2]));
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

  const handleColorPickerChange = (color: any) => {
    const { r, g, b } = color.rgb;
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
          <h3 className="text-xl font-normal mb-4">HLS</h3>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-sm font-normal">Hue</Label>
              <Slider
                value={[h]}
                max={360}
                step={1}
                onValueChange={(value: number[]) => handleHlsChange(0, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Lightness</Label>
              <Slider
                value={[l]}
                max={100}
                step={1}
                onValueChange={(value: number[]) => handleHlsChange(1, value)}
                className={paperSliderStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">Saturation</Label>
              <Slider
                value={[s]}
                max={100}
                step={1}
                onValueChange={(value: number[]) => handleHlsChange(2, value)}
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
      <div className="min-w-[200px] flex items-center justify-center">
        {/* <h3 className="text-xl font-normal mb-4">Color Picker</h3> */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-12 h-12 border border-black/10 shadow-sm transition-shadow hover:shadow-md"
              style={{ background: `rgb(${rgb.join(",")})` }}
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border-black/10 bg-[hsl(40_20%_94%)] p-0 shadow-lg"
            align="end"
            side="right"
            alignOffset={-50}
            sideOffset={30}
          >
            <SketchPicker
              color={{ r: rgb[0], g: rgb[1], b: rgb[2] }}
              onChange={handleColorPickerChange}
              disableAlpha={true}
              className="bg-[hsl(40_20%_94%)]"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ColorControls;
