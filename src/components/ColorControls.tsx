import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { rgbToHls, rgbToHsv, hlsToRgb, hsvToRgb } from "@/lib/color-utils";
import React, { ChangeEvent } from "react";
import { SketchPicker } from "react-color";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ColorControlsProps {
  rgb: [number, number, number];
  onChange: (rgb: [number, number, number]) => void;
}

export const ColorControls = ({ rgb, onChange }: ColorControlsProps) => {
  const [previousHsl, setPreviousHsl] = React.useState(0);
  const [previousHsv, setPreviousHsv] = React.useState(0);
  const [emptyInputs, setEmptyInputs] = React.useState<Set<string>>(new Set());

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

  const handleColorPickerChange = (color: any) => {
    const { r, g, b } = color.rgb;
    onChange([r, g, b]);
  };

  const handleNumericInput = (
    value: string,
    index: number,
    type: "rgb" | "hls" | "hsv"
  ) => {
    const inputId = `${type}-${index}`;

    if (value === "") {
      setEmptyInputs((prev) => new Set(prev).add(inputId));
      return;
    }

    setEmptyInputs((prev) => {
      const next = new Set(prev);
      next.delete(inputId);
      return next;
    });

    const numValue = parseInt(value) || 0;
    let clampedValue = numValue;

    if (type === "rgb") {
      clampedValue = Math.max(0, Math.min(255, numValue));
      handleRgbChange(index, [clampedValue]);
    } else if (type === "hls") {
      if (index === 0) {
        clampedValue = Math.max(0, Math.min(359, numValue));
      } else {
        clampedValue = Math.max(0, Math.min(100, numValue));
      }
      handleHlsChange(index, [clampedValue]);
    } else if (type === "hsv") {
      if (index === 0) {
        clampedValue = Math.max(0, Math.min(359, numValue));
      } else {
        clampedValue = Math.max(0, Math.min(100, numValue));
      }
      handleHsvChange(index, [clampedValue]);
    }
  };

  const handleInputBlur = (index: number, type: "rgb" | "hls" | "hsv") => {
    const inputId = `${type}-${index}`;
    if (emptyInputs.has(inputId)) {
      setEmptyInputs((prev) => {
        const next = new Set(prev);
        next.delete(inputId);
        return next;
      });

      if (type === "rgb") {
        handleRgbChange(index, [0]);
      } else if (type === "hls") {
        handleHlsChange(index, [0]);
      } else if (type === "hsv") {
        handleHsvChange(index, [0]);
      }
    }
  };

  const getInputValue = (value: number, inputId: string) => {
    return emptyInputs.has(inputId) ? "" : Math.round(value);
  };

  const paperSliderStyle =
    "hover:bg-black/5 rounded-sm [&_[role=slider]]:rounded-sm [&_[role=slider]]:border-black/20 [&_[role=slider]]:shadow-sm [&_[role=slider]]:hover:border-black/40 [&_[role=track]]:bg-black/10 [&_[role=range]]:bg-black/20";

  const inputStyle = "w-12 text-sm text-black/60 text-right tabular-nums p-0";

  const ColorControls = (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Red</Label>
          <Input
            type="number"
            value={getInputValue(rgb[0], "rgb-0")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleNumericInput(e.target.value, 0, "rgb")
            }
            className={inputStyle}
            min={0}
            max={255}
            onBlur={() => handleInputBlur(0, "rgb")}
          />
        </div>
        <Slider
          value={[rgb[0]]}
          max={255}
          step={1}
          onValueChange={(value: number[]) => handleRgbChange(0, value)}
          className={paperSliderStyle}
        />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Green</Label>
          <Input
            type="number"
            value={getInputValue(rgb[1], "rgb-1")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleNumericInput(e.target.value, 1, "rgb")
            }
            className={inputStyle}
            min={0}
            max={255}
            onBlur={() => handleInputBlur(1, "rgb")}
          />
        </div>
        <Slider
          value={[rgb[1]]}
          max={255}
          step={1}
          onValueChange={(value: number[]) => handleRgbChange(1, value)}
          className={paperSliderStyle}
        />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Blue</Label>
          <Input
            type="number"
            value={getInputValue(rgb[2], "rgb-2")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleNumericInput(e.target.value, 2, "rgb")
            }
            className={inputStyle}
            min={0}
            max={255}
            onBlur={() => handleInputBlur(2, "rgb")}
          />
        </div>
        <Slider
          value={[rgb[2]]}
          max={255}
          step={1}
          onValueChange={(value: number[]) => handleRgbChange(2, value)}
          className={paperSliderStyle}
        />
      </div>
    </div>
  );

  const HLSControls = (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Hue</Label>
          <div className="flex items-center">
            <Input
              type="number"
              value={getInputValue(h, "hls-0")}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleNumericInput(e.target.value, 0, "hls")
              }
              className={inputStyle}
              min={0}
              max={359}
              onBlur={() => handleInputBlur(0, "hls")}
            />
            <span className="ml-1 text-sm text-black/60">°</span>
          </div>
        </div>
        <Slider
          value={[h]}
          max={359}
          step={1}
          onValueChange={(value: number[]) => handleHlsChange(0, value)}
          className={paperSliderStyle}
        />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Lightness</Label>
          <div className="flex items-center">
            <Input
              type="number"
              value={getInputValue(l, "hls-1")}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleNumericInput(e.target.value, 1, "hls")
              }
              className={inputStyle}
              min={0}
              max={100}
              onBlur={() => handleInputBlur(1, "hls")}
            />
            <span className="ml-1 text-sm text-black/60">%</span>
          </div>
        </div>
        <Slider
          value={[l]}
          max={100}
          step={1}
          onValueChange={(value: number[]) => handleHlsChange(1, value)}
          className={paperSliderStyle}
        />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Saturation</Label>
          <div className="flex items-center">
            <Input
              type="number"
              value={getInputValue(s, "hls-2")}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleNumericInput(e.target.value, 2, "hls")
              }
              className={inputStyle}
              min={0}
              max={100}
              onBlur={() => handleInputBlur(2, "hls")}
            />
            <span className="ml-1 text-sm text-black/60">%</span>
          </div>
        </div>
        <Slider
          value={[s]}
          max={100}
          step={1}
          onValueChange={(value: number[]) => handleHlsChange(2, value)}
          className={paperSliderStyle}
        />
      </div>
    </div>
  );

  const HSVControls = (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Hue</Label>
          <div className="flex items-center">
            <Input
              type="number"
              value={getInputValue(hv, "hsv-0")}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleNumericInput(e.target.value, 0, "hsv")
              }
              className={inputStyle}
              min={0}
              max={359}
              onBlur={() => handleInputBlur(0, "hsv")}
            />
            <span className="ml-1 text-sm text-black/60">°</span>
          </div>
        </div>
        <Slider
          value={[hv]}
          max={359}
          step={1}
          onValueChange={(value: number[]) => handleHsvChange(0, value)}
          className={paperSliderStyle}
        />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Saturation</Label>
          <div className="flex items-center">
            <Input
              type="number"
              value={getInputValue(sv, "hsv-1")}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleNumericInput(e.target.value, 1, "hsv")
              }
              className={inputStyle}
              min={0}
              max={100}
              onBlur={() => handleInputBlur(1, "hsv")}
            />
            <span className="ml-1 text-sm text-black/60">%</span>
          </div>
        </div>
        <Slider
          value={[sv]}
          max={100}
          step={1}
          onValueChange={(value: number[]) => handleHsvChange(1, value)}
          className={paperSliderStyle}
        />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-normal">Value</Label>
          <div className="flex items-center">
            <Input
              type="number"
              value={getInputValue(v, "hsv-2")}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleNumericInput(e.target.value, 2, "hsv")
              }
              className={inputStyle}
              min={0}
              max={100}
              onBlur={() => handleInputBlur(2, "hsv")}
            />
            <span className="ml-1 text-sm text-black/60">%</span>
          </div>
        </div>
        <Slider
          value={[v]}
          max={100}
          step={1}
          onValueChange={(value: number[]) => handleHsvChange(2, value)}
          className={paperSliderStyle}
        />
      </div>
    </div>
  );

  return (
    <div className="flex items-stretch">
      <div className="flex-1 p-8 pt-4">
        {/* Desktop View */}
        <div className="hidden md:flex gap-8">
          <div className="flex-1">
            <h3 className="text-xl font-normal mb-2">RGB</h3>
            {ColorControls}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-normal mb-2">HLS</h3>
            {HLSControls}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-normal mb-2">HSV</h3>
            {HSVControls}
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden w-full">
          <Tabs defaultValue="rgb" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6 gap-2">
              <TabsTrigger value="rgb">RGB</TabsTrigger>
              <TabsTrigger value="hls">HLS</TabsTrigger>
              <TabsTrigger value="hsv">HSV</TabsTrigger>
            </TabsList>

            <TabsContent value="rgb" className="w-full">
              {ColorControls}
            </TabsContent>

            <TabsContent value="hls" className="w-full">
              {HLSControls}
            </TabsContent>

            <TabsContent value="hsv" className="w-full">
              {HSVControls}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden md:block flex-none">
        <Separator orientation="vertical" className="h-full border-black/10" />
      </div>

      <div className="min-w-[200px] md:flex items-center justify-center p-8 hidden">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-12 h-12 border border-black/30 border-solid"
              style={{ background: `rgb(${rgb.join(",")})` }}
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border border-black/30 rounded-none"
            align="end"
            alignOffset={-50}
            side="right"
            sideOffset={10}
            style={{ background: "transparent" }}
          >
            <div
              className="sketch-picker-wrapper rounded-none"
              style={{ background: "hsl(40, 20%, 94%)" }}
            >
              <SketchPicker
                color={{ r: rgb[0], g: rgb[1], b: rgb[2] }}
                onChange={handleColorPickerChange}
                disableAlpha={true}
                styles={{
                  default: {
                    picker: {
                      background: "hsl(40, 20%, 94%)",
                      borderRadius: "0px",
                    },
                    saturation: {
                      border: "1px solid #00000055",
                    },
                  },
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Color Picker */}
      <div className="md:hidden fixed bottom-[230px] right-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-12 h-12 border border-black/30 border-solid shadow-lg"
              style={{ background: `rgb(${rgb.join(",")})` }}
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border border-black/30 rounded-none"
            align="end"
            side="top"
            sideOffset={16}
            style={{ background: "transparent" }}
          >
            <div
              className="sketch-picker-wrapper rounded-none"
              style={{ background: "hsl(40, 20%, 94%)" }}
            >
              <SketchPicker
                color={{ r: rgb[0], g: rgb[1], b: rgb[2] }}
                onChange={handleColorPickerChange}
                disableAlpha={true}
                styles={{
                  default: {
                    picker: {
                      background: "hsl(40, 20%, 94%)",
                      borderRadius: "0px",
                    },
                    saturation: {
                      border: "1px solid #00000055",
                    },
                  },
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ColorControls;
