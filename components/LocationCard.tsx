"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapCanvas } from "@/components/MapCanvas";
import type { MapGuide } from "@/components/MapCanvas";
import { formatWhen } from "@/lib/format";
import { readCurrentPosition, sendJson } from "@/lib/request";
import type { Presence } from "@/lib/types";

type Precision = "exact" | "fuzzy";

export function LocationCard({
  initial,
  guides = [],
  showMap = false,
  onChange,
}: {
  initial: Presence | null;
  guides?: MapGuide[];
  showMap?: boolean;
  onChange?: (presence: Presence | null) => void;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(Boolean(initial));
  const [precision, setPrecision] = useState<Precision>(initial?.precision ?? "fuzzy");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null,
  );
  const [focusToken, setFocusToken] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(initial?.updatedAt ?? null);

  async function locate() {
    setError("");
    try {
      const point = await readCurrentPosition();
      setCoords(point);
      setFocusToken((value) => value + 1);
      return point;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "没有拿到位置");
      return null;
    }
  }

  async function save(nextCoords = coords, nextEnabled = true) {
    setError("");
    if (nextEnabled && !nextCoords) {
      setError("先获取当前位置，或在地图上点一个点。");
      return;
    }
    setPending(true);
    try {
      const data = (await sendJson("/api/me/location", "PUT", nextEnabled
        ? { enabled: true, lat: nextCoords?.lat, lng: nextCoords?.lng, label, precision }
        : { enabled: false })) as { presence: Presence | null };
      setSavedAt(data.presence?.updatedAt ?? null);
      if (data.presence) setCoords({ lat: data.presence.lat, lng: data.presence.lng });
      onChange?.(data.presence);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "位置没有保存");
    } finally {
      setPending(false);
    }
  }

  async function toggle(next: boolean) {
    setEnabled(next);
    if (!next) {
      await save(coords, false);
      return;
    }
  }

  return (
    <section className="location-card">
      <header className="section-head">
        <h2>共享位置</h2>
        <label className="switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => void toggle(event.target.checked)}
          />
          <span>{enabled ? "已开启" : "未开启"}</span>
        </label>
      </header>
      <p className="help">
        开启后，其他旅人会在地图上看到你的昵称和位置，24 小时没有更新就会自动消失。建议用模糊位置，大约精确到一公里。可以随时关闭。
      </p>
      {enabled ? (
        <div className="location-form">
          <fieldset className="precision">
            <legend>精确程度</legend>
            <label>
              <input
                type="radio"
                name="precision"
                checked={precision === "fuzzy"}
                onChange={() => setPrecision("fuzzy")}
              />
              模糊，约 1 公里
            </label>
            <label>
              <input
                type="radio"
                name="precision"
                checked={precision === "exact"}
                onChange={() => setPrecision("exact")}
              />
              精确到当前位置
            </label>
          </fieldset>
          <label className="field">
            <span>一句话说明，可选</span>
            <input
              value={label}
              maxLength={24}
              placeholder="例如：在古城南门附近"
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
          {showMap ? (
            <div className="mini-map">
              <MapCanvas
                guides={guides}
                fitKey="write"
                initialCenter={coords ? { ...coords, zoom: 12 } : null}
                pickEnabled
                picked={coords}
                onPick={(lat, lng) => setCoords({ lat, lng })}
                focusPoint={coords}
                focusToken={focusToken}
              />
            </div>
          ) : null}
          <div className="composer-bar">
            <button type="button" className="btn btn-small btn-ghost" onClick={() => void locate()} disabled={pending}>
              使用当前位置
            </button>
            <button type="button" className="btn btn-small btn-sienna" onClick={() => void save()} disabled={pending}>
              {pending ? "保存中" : "保存到地图"}
            </button>
          </div>
          {coords ? (
            <p className="help">
              将共享 {coords.lat.toFixed(precision === "fuzzy" ? 2 : 5)}, {coords.lng.toFixed(precision === "fuzzy" ? 2 : 5)}
              {savedAt ? ` · 上次更新 ${formatWhen(savedAt)}` : ""}
            </p>
          ) : (
            <p className="help">还没有选定位置。</p>
          )}
        </div>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
