export type RGB = [number, number, number];

export type SavedPoint = {
  id: string;
  type: "point";
  rgb: RGB;
  interpolated: boolean;
};

export type SavedVolume = {
  id: string;
  type: "volume";
  startRgb: RGB;
  endRgb: RGB;
};

export type SavedColor = SavedPoint;

export type ColorMode = "point" | "volume";
