import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CommentSection } from "@/components/CommentSection";
import { CoverArt } from "@/components/CoverArt";
import { DeleteGuideButton } from "@/components/DeleteGuideButton";
import { Footer } from "@/components/Footer";
import { MapCanvas } from "@/components/MapCanvas";
import { RichText } from "@/components/RichText";
import { ShareSheet } from "@/components/ShareSheet";
import { getCurrentUser } from "@/lib/auth";
import { listCommentTree } from "@/lib/comments";
import { isDemoMode } from "@/lib/config";
import { formatCoord, formatWhen } from "@/lib/format";
import { getGuide } from "@/lib/guides";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const guide = getGuide(Number((await params).id));
  if (!guide) return { title: "没有找到攻略" };
  return {
    title: `${guide.destination} · ${guide.title}`,
    description: guide.summary,
  };
}

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const guide = getGuide(id);
  if (!guide) notFound();
  const user = await getCurrentUser();
  const comments = listCommentTree(guide.id);
  const owner = user?.id === guide.authorId;

  return (
    <div className="page-scroll" id="content">
      <article>
        <header className="guide-hero">
          <CoverArt theme={guide.coverTheme} className="hero-art" />
          <div className="hero-shade" />
          <div className="hero-copy">
            <div className="hero-inner">
              <p className="eyebrow">
                {guide.region} · {guide.destination}
              </p>
              <h1>{guide.title}</h1>
              <p className="hero-summary">{guide.summary}</p>
            </div>
          </div>
        </header>
        <div className="guide-layout">
          <div className="guide-main">
            <ul className="meta-chips">
              <li>{guide.days} 天</li>
              <li>{guide.season}</li>
              <li>{guide.budget}</li>
            </ul>
            <div className="byline">
              <Avatar name={guide.authorName} id={guide.authorId} />
              <div>
                <strong>{guide.authorName}</strong>
                <time dateTime={new Date(guide.createdAt).toISOString()}>{formatWhen(guide.createdAt)}</time>
              </div>
              {owner ? (
                <div className="owner-actions">
                  <Link className="btn btn-small btn-ghost" href={`/guides/${guide.id}/edit`}>
                    编辑
                  </Link>
                  <DeleteGuideButton id={guide.id} />
                </div>
              ) : null}
            </div>
            <RichText text={guide.content} />
            <ShareSheet title={`${guide.destination} · ${guide.title}`} summary={guide.summary} path={`/guides/${guide.id}`} />
            <CommentSection guideId={guide.id} comments={comments} currentUserId={user?.id ?? null} />
          </div>
          <aside className="guide-side">
            <div className="side-map">
              <MapCanvas
                guides={[
                  {
                    id: guide.id,
                    destination: guide.destination,
                    title: guide.title,
                    lat: guide.lat,
                    lng: guide.lng,
                    coverTheme: guide.coverTheme,
                  },
                ]}
                fitKey={String(guide.id)}
              />
            </div>
            <div className="side-card">
              <strong>{guide.destination}</strong>
              <p className="help">{formatCoord(guide.lat, guide.lng)} · WGS84</p>
              <div className="tag-list">
                {guide.tags.map((tag) => (
                  <Link key={tag} className="tag" href={`/?q=${encodeURIComponent(tag)}`}>
                    {tag}
                  </Link>
                ))}
              </div>
              <Link className="btn btn-small btn-ghost" href={`/?region=${encodeURIComponent(guide.region)}`}>
                看{guide.region}的其他攻略
              </Link>
            </div>
          </aside>
        </div>
      </article>
      <div className="narrow">
        <Footer demo={isDemoMode()} />
      </div>
    </div>
  );
}
