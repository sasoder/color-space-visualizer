export type RGB = [number, number, number];

export type SavedPoint = {
  id: string;
  type: "point";
  rgb: RGB;
};

export type SavedVolume = {
  id: string;
  type: "volume";
  startRgb: RGB;
  endRgb: RGB;
};

export type SavedColor = SavedPoint | SavedVolume;

export type ColorMode = "point" | "volume";
