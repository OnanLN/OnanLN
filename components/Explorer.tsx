"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CoverArt } from "@/components/CoverArt";
import { Footer } from "@/components/Footer";
import { LocationCard } from "@/components/LocationCard";
import { MapCanvas, type MapGuide } from "@/components/MapCanvas";
import { formatWhen } from "@/lib/format";
import { readCurrentPosition } from "@/lib/request";
import type { Guide, Presence } from "@/lib/types";

function toPin(guide: Guide): MapGuide {
  return {
    id: guide.id,
    destination: guide.destination,
    title: guide.title,
    lat: guide.lat,
    lng: guide.lng,
    coverTheme: guide.coverTheme,
  };
}

export function Explorer({
  guides,
  presences,
  initialQuery,
  initialRegion,
  currentUser,
  demo,
}: {
  guides: Guide[];
  presences: Presence[];
  initialQuery: string;
  initialRegion: string;
  currentUser: { id: number; nickname: string } | null;
  demo: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState(initialRegion);
  const [tab, setTab] = useState<"map" | "list">("map");
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ token: number; guideId?: number; point?: { lat: number; lng: number } }>({
    token: 0,
  });
  const [fitNonce, setFitNonce] = useState(0);
  const [people, setPeople] = useState(presences);
  const [shareOpen, setShareOpen] = useState(false);
  const [selfPoint, setSelfPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState("");

  const regions = useMemo(() => [...new Set(guides.map((guide) => guide.region))], [guides]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guides.filter((guide) => {
      if (region && guide.region !== region) return false;
      if (!needle) return true;
      const haystack = [guide.title, guide.destination, guide.region, guide.summary, guide.authorName, ...guide.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [guides, query, region]);

  useEffect(() => {
    if (selectedId && !filtered.some((guide) => guide.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (region) params.set("region", region);
    const next = params.toString();
    const url = next ? `/?${next}` : "/";
    if (`${window.location.pathname}${window.location.search}` !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [query, region]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/presences");
        if (!response.ok) return;
        const data = (await response.json()) as { presences: Presence[] };
        setPeople(data.presences);
      } catch {
        // 地图上的人位置刷新失败时，保留上一次的结果。
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = filtered.find((guide) => guide.id === selectedId) ?? null;
  const fitKey = `${filtered.map((guide) => guide.id).join(",") || "none"}:${fitNonce}`;

  function locate(id: number) {
    setSelectedId(id);
    setFocus((current) => ({ token: current.token + 1, guideId: id }));
    setTab("map");
  }

  async function showSelf() {
    setGeoError("");
    try {
      const point = await readCurrentPosition();
      setSelfPoint(point);
      setFocus((current) => ({ token: current.token + 1, point }));
      setTab("map");
    } catch (reason) {
      setGeoError(reason instanceof Error ? reason.message : "没有拿到位置");
    }
  }

  return (
    <div className="explorer" data-tab={tab} id="content">
      <section className="panel">
        <div className="panel-head">
          <div className="panel-intro">
            <p className="eyebrow">同一张地图</p>
            <h1>把路过的地方，写成可以跟着走的攻略。</h1>
            <p>十篇示范笔记已经钉在上面。登录之后，你也可以把自己的路线、留言和位置放进来。</p>
          </div>
          <label className="search">
            <span className="sr-only">搜索目的地或攻略</span>
            <input
              value={query}
              placeholder="搜索大理、高原、早餐…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="chips" role="tablist" aria-label="按地区筛选">
            <button type="button" className="chip" data-on={region === "" ? "true" : "false"} onClick={() => setRegion("")}>
              全部
            </button>
            {regions.map((item) => (
              <button
                key={item}
                type="button"
                className="chip"
                data-on={region === item ? "true" : "false"}
                onClick={() => setRegion(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="seg" role="tablist" aria-label="切换地图或列表">
            <button type="button" role="tab" aria-selected={tab === "map"} onClick={() => setTab("map")}>
              地图
            </button>
            <button type="button" role="tab" aria-selected={tab === "list"} onClick={() => setTab("list")}>
              列表
            </button>
          </div>
        </div>
        <div className="panel-scroll">
          <p className="count-line">{filtered.length} 篇攻略</p>
          {filtered.length ? (
            <ul className="guide-list">
              {filtered.map((guide) => (
                <li key={guide.id}>
                  <article
                    className="guide-row"
                    data-active={guide.id === selectedId ? "true" : "false"}
                    onMouseEnter={() => setHoverId(guide.id)}
                    onMouseLeave={() => setHoverId(null)}
                  >
                    <Link href={`/guides/${guide.id}`} className="row-link">
                      <span className="thumb">
                        <CoverArt theme={guide.coverTheme} />
                      </span>
                      <span className="row-copy">
                        <span className="dest">
                          {guide.region} · {guide.destination}
                        </span>
                        <strong>{guide.title}</strong>
                        <span className="meta">
                          {guide.authorName} · {guide.days} 天 · {guide.commentCount} 条留言 · {formatWhen(guide.createdAt)}
                        </span>
                      </span>
                    </Link>
                    <button type="button" className="row-pin" onClick={() => locate(guide.id)}>
                      在地图上
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <p>还没有和「{query || region}」有关的攻略。</p>
              <Link className="btn btn-small btn-sienna" href="/guides/new">
                写下第一篇
              </Link>
            </div>
          )}
          <Footer demo={demo} />
        </div>
      </section>
      <section className="map-pane" aria-label="旅行攻略地图">
        <div className="map-frame">
          <MapCanvas
            guides={filtered.map(toPin)}
            presences={people}
            selectedId={selectedId}
            hoverId={hoverId}
            focusToken={focus.token}
            focusGuideId={focus.guideId ?? null}
            focusPoint={focus.point ?? null}
            selfPoint={selfPoint}
            fitKey={fitKey}
            onSelect={locate}
            currentUserId={currentUser?.id ?? null}
          />
          <div className="map-tools">
            <button
              type="button"
              className="map-tool"
              onClick={() => {
                setSelectedId(null);
                setFitNonce((value) => value + 1);
              }}
            >
              回到全部
            </button>
            <button type="button" className="map-tool" onClick={() => void showSelf()}>
              我在这
            </button>
            {currentUser ? (
              <button type="button" className="map-tool" onClick={() => setShareOpen((open) => !open)}>
                共享位置
              </button>
            ) : (
              <Link className="map-tool" href="/login?next=/">
                共享位置
              </Link>
            )}
          </div>
          <div className="legend">
            <span>
              <i className="legend-guide" /> 攻略
            </span>
            <span>
              <i className="legend-person" /> 旅人
            </span>
            <span>WGS84</span>
          </div>
          {geoError ? (
            <p className="map-toast" role="status">
              {geoError}
            </p>
          ) : null}
          {selected ? (
            <Link className="peek" href={`/guides/${selected.id}`}>
              <span className="thumb">
                <CoverArt theme={selected.coverTheme} />
              </span>
              <span>
                <span className="dest">
                  {selected.region} · {selected.destination}
                </span>
                <strong>{selected.title}</strong>
                <em>查看攻略</em>
              </span>
            </Link>
          ) : null}
          {shareOpen && currentUser ? (
            <div className="drawer">
              <div className="sheet-head">
                <strong>把我标在地图上</strong>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => setShareOpen(false)}>
                  关闭
                </button>
              </div>
              <LocationCard
                initial={people.find((person) => person.userId === currentUser.id) ?? null}
                onChange={(presence) => {
                  setPeople((current) => {
                    const rest = current.filter((person) => person.userId !== currentUser.id);
                    return presence ? [presence, ...rest] : rest;
                  });
                }}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
