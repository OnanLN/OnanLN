"use client";

type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  tone?: "lot" | "spot";
};

export function MapCanvas({
  points,
  selectedId,
  onSelect,
  caption,
}: {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  caption?: string;
}) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  if (!Number.isFinite(minLat)) {
    minLat = 31.2;
    maxLat = 31.3;
    minLng = 121.4;
    maxLng = 121.55;
  }
  const latSpan = Math.max(0.01, maxLat - minLat);
  const lngSpan = Math.max(0.01, maxLng - minLng);
  minLat -= latSpan * 0.18;
  maxLat += latSpan * 0.18;
  minLng -= lngSpan * 0.18;
  maxLng += lngSpan * 0.18;

  const project = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * 100,
    y: (1 - (lat - minLat) / (maxLat - minLat)) * 100,
  });

  return (
    <section className="map-card" aria-label="车位相对位置">
      <div className="map-top">
        <span>相对位置</span>
        <strong>{caption || "按远近排布"}</strong>
      </div>
      <div className="map-stage">
        <svg className="map-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="river" d="M78 -5 C62 20, 86 38, 64 58 C46 74, 70 86, 58 110" />
          <path className="river" d="M-5 72 C22 64, 38 86, 62 78 C78 72, 90 90, 110 84" />
        </svg>
        {points.map((point) => {
          const pos = project(point.lat, point.lng);
          const on = point.id === selectedId;
          return (
            <button
              key={point.id}
              type="button"
              className={`pin ${point.tone === "spot" ? "spot" : ""} ${on ? "on" : ""}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => onSelect?.(point.id)}
            >
              {point.label}
            </button>
          );
        })}
        {points.length === 0 ? <p className="map-empty empty">这附近还没有点位</p> : null}
      </div>
      <p className="map-note">示意地图只比较谁更近，不拿来导航。正式导航以后接地图开放平台。</p>
    </section>
  );
}
