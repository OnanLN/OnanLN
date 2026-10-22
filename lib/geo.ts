export type Precision = "exact" | "fuzzy";

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function applyPrecision(lat: number, lng: number, precision: Precision) {
  if (precision === "exact") {
    return { lat: roundTo(lat, 6), lng: roundTo(lng, 6) };
  }
  return { lat: roundTo(lat, 2), lng: roundTo(lng, 2) };
}
