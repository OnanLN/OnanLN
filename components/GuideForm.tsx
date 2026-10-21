"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoverArt } from "@/components/CoverArt";
import { MapCanvas, type MapGuide } from "@/components/MapCanvas";
import { readCurrentPosition, sendJson } from "@/lib/request";
import { THEMES, THEME_LABEL, type CoverTheme } from "@/lib/themes";
import type { Guide } from "@/lib/types";
import { guideInputSchema, parseTags, zodMessage } from "@/lib/validators";

const CONTENT_HINT = `## 怎么去

## 怎么玩

## 吃什么

## 花费与避坑
`;

export function GuideForm({
  mode,
  initial,
  regions,
  guides,
}: {
  mode: "create" | "edit";
  initial?: Guide;
  regions: string[];
  guides: MapGuide[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [days, setDays] = useState(String(initial?.days ?? 3));
  const [season, setSeason] = useState(initial?.season ?? "");
  const [budget, setBudget] = useState(initial?.budget ?? "");
  const [tags, setTags] = useState(initial?.tags.join(" ") ?? "");
  const [theme, setTheme] = useState<CoverTheme>(initial?.coverTheme ?? "lake");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null,
  );
  const [focusToken, setFocusToken] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function useHere() {
    setError("");
    try {
      const point = await readCurrentPosition();
      setCoords(point);
      setFocusToken((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "没有拿到位置");
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      title,
      destination,
      region,
      summary,
      content,
      lat: coords?.lat,
      lng: coords?.lng,
      coverTheme: theme,
      tags: parseTags(tags),
      days: Number(days),
      season,
      budget,
    };
    const parsed = guideInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(zodMessage(parsed.error));
      return;
    }
    setPending(true);
    setError("");
    try {
      if (mode === "create") {
        const data = (await sendJson("/api/guides", "POST", parsed.data)) as { guide: Guide };
        router.push(`/guides/${data.guide.id}`);
        router.refresh();
      } else if (initial) {
        await sendJson(`/api/guides/${initial.id}`, "PUT", parsed.data);
        router.push(`/guides/${initial.id}`);
        router.refresh();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "没有保存成功");
      setPending(false);
    }
  }

  return (
    <form className="write-layout" onSubmit={onSubmit}>
      <div className="write-main">
        <p className="eyebrow">{mode === "create" ? "新的攻略" : "修改攻略"}</p>
        <h1>{mode === "create" ? "把一条路写清楚" : "改一改这篇攻略"}</h1>
        <p className="lede">先在地图上钉住位置，再写别人真的用得上的走法、吃法和花费。</p>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <label className="field">
          <span>标题</span>
          <input value={title} maxLength={40} onChange={(event) => setTitle(event.target.value)} placeholder="给这条路线起个名字" />
          <em className="counter">{title.trim().length}/40</em>
        </label>
        <div className="form-2">
          <label className="field">
            <span>目的地</span>
            <input value={destination} maxLength={20} onChange={(event) => setDestination(event.target.value)} placeholder="例如：大理" />
          </label>
          <label className="field">
            <span>地区</span>
            <input value={region} maxLength={12} list="region-options" onChange={(event) => setRegion(event.target.value)} placeholder="例如：云南" />
            <datalist id="region-options">
              {regions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
        </div>
        <label className="field">
          <span>摘要</span>
          <textarea
            value={summary}
            maxLength={140}
            rows={3}
            placeholder="用两句话说明这篇适合谁、不要怎么玩。"
            onChange={(event) => setSummary(event.target.value)}
          />
          <em className="counter">{summary.trim().length}/140</em>
        </label>
        <div className="form-3">
          <label className="field">
            <span>天数</span>
            <input type="number" min={1} max={60} value={days} onChange={(event) => setDays(event.target.value)} />
          </label>
          <label className="field">
            <span>季节</span>
            <input value={season} maxLength={16} placeholder="春秋最舒服" onChange={(event) => setSeason(event.target.value)} />
          </label>
          <label className="field">
            <span>花费</span>
            <input value={budget} maxLength={24} placeholder="人均 1500 元" onChange={(event) => setBudget(event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>标签，用空格或逗号分开，最多 5 个</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="骑行 古城 湖泊" />
        </label>
        <fieldset className="field">
          <legend>封面气质</legend>
          <div className="theme-grid">
            {THEMES.map((item) => (
              <button
                key={item}
                type="button"
                className="theme-option"
                data-on={theme === item ? "true" : "false"}
                aria-pressed={theme === item}
                onClick={() => setTheme(item)}
              >
                <CoverArt theme={item} />
                <span>{THEME_LABEL[item]}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>正文</span>
          <textarea
            value={content}
            maxLength={8000}
            rows={14}
            placeholder={CONTENT_HINT}
            onChange={(event) => setContent(event.target.value)}
          />
          <em className="counter">{content.trim().length}/8000 · 单独一行以 ## 开头会变成小标题</em>
        </label>
        <button className="btn btn-sienna" type="submit" disabled={pending}>
          {pending ? "保存中" : mode === "create" ? "发表攻略" : "保存修改"}
        </button>
      </div>
      <aside className="write-side">
        <div className="write-map">
          <MapCanvas
            guides={guides}
            fitKey="write"
            initialCenter={initial ? { lat: initial.lat, lng: initial.lng, zoom: 11 } : null}
            pickEnabled
            picked={coords}
            onPick={(lat, lng) => setCoords({ lat, lng })}
            focusPoint={coords}
            focusToken={focusToken}
          />
        </div>
        <div className="side-card">
          <strong>在地图上钉住</strong>
          <p className="help">点地图放下这枚钉子，或使用你现在的位置。坐标按 GPS 使用的 WGS84 保存。</p>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => void useHere()}>
            使用当前位置
          </button>
          <p className="help">{coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "还没有选择位置"}</p>
        </div>
      </aside>
    </form>
  );
}
