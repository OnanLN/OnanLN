"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CoverArt } from "@/components/CoverArt";
import { Footer } from "@/components/Footer";
import { formatWhen } from "@/lib/format";
import type { Guide } from "@/lib/types";

export function GuideCatalog({
  guides,
  initialQuery,
  initialRegion,
  demo,
}: {
  guides: Guide[];
  initialQuery: string;
  initialRegion: string;
  demo: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState(initialRegion);
  const regions = useMemo(() => [...new Set(guides.map((guide) => guide.region))], [guides]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guides.filter((guide) => {
      if (region && guide.region !== region) return false;
      if (!needle) return true;
      return [guide.title, guide.destination, guide.region, guide.summary, ...guide.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [guides, query, region]);

  return (
    <div className="page-scroll" id="content">
      <div className="catalog">
        <header className="catalog-head">
          <p className="eyebrow">攻略</p>
          <h1>按目的地翻一遍</h1>
          <p className="lede">每篇都钉在地图上。想先看位置，回到地图页点「在地图上」。</p>
          <label className="search">
            <span className="sr-only">搜索攻略</span>
            <input value={query} placeholder="搜索目的地、标签或句子" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="chips">
            <button type="button" className="chip" data-on={!region ? "true" : "false"} onClick={() => setRegion("")}>
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
        </header>
        {filtered.length ? (
          <div className="catalog-grid">
            {filtered.map((guide) => (
              <Link key={guide.id} href={`/guides/${guide.id}`} className="catalog-card">
                <span className="thumb tall">
                  <CoverArt theme={guide.coverTheme} />
                </span>
                <span className="dest">
                  {guide.region} · {guide.destination}
                </span>
                <strong>{guide.title}</strong>
                <span className="summary">{guide.summary}</span>
                <span className="meta">
                  {guide.days} 天 · {guide.authorName} · {guide.commentCount} 条留言 · {formatWhen(guide.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>没有找到对应的攻略。</p>
            <Link className="btn btn-small btn-sienna" href="/guides/new">
              写一篇
            </Link>
          </div>
        )}
        <Footer demo={demo} />
      </div>
    </div>
  );
}
