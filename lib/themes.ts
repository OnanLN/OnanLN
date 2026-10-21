export const THEMES = [
  "lake",
  "forest",
  "market",
  "river",
  "oldtown",
  "mountain",
  "coast",
  "desert",
  "garden",
  "harbor",
] as const;

export type CoverTheme = (typeof THEMES)[number];

export const THEME_LABEL: Record<CoverTheme, string> = {
  lake: "湖",
  forest: "林",
  market: "市井",
  river: "江",
  oldtown: "古城",
  mountain: "山",
  coast: "海岸",
  desert: "沙漠",
  garden: "园林",
  harbor: "港湾",
};

export const THEME_COLOR: Record<CoverTheme, string> = {
  lake: "#2a6f86",
  forest: "#1f5c49",
  market: "#c4481d",
  river: "#2f6f62",
  oldtown: "#8c3d4a",
  mountain: "#3d5170",
  coast: "#1f6f8a",
  desert: "#c46a32",
  garden: "#3f6b4e",
  harbor: "#214e68",
};

export function isTheme(value: string): value is CoverTheme {
  return (THEMES as readonly string[]).includes(value);
}

export function themeColor(value: string) {
  return isTheme(value) ? THEME_COLOR[value] : THEME_COLOR.lake;
}
