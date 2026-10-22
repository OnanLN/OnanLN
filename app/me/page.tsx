import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Footer } from "@/components/Footer";
import { LocationCard } from "@/components/LocationCard";
import { LogoutButton, ProfileEditor } from "@/components/ProfileEditor";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { listGuides, listGuidesByAuthor } from "@/lib/guides";
import { getPresence } from "@/lib/presence";

export const dynamic = "force-dynamic";
export const metadata = { title: "我的" };

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");
  const guides = listGuidesByAuthor(user.id);
  const pins = listGuides().map((guide) => ({
    id: guide.id,
    destination: guide.destination,
    title: guide.title,
    lat: guide.lat,
    lng: guide.lng,
    coverTheme: guide.coverTheme,
  }));

  return (
    <div className="page-scroll" id="content">
      <div className="me">
        <header className="profile-head">
          <Avatar name={user.nickname} id={user.id} size={64} />
          <div>
            <h1>{user.nickname}</h1>
            <p>{user.phoneMask}</p>
          </div>
        </header>
        <ProfileEditor user={user} />
        <LocationCard initial={getPresence(user.id)} guides={pins} showMap />
        <section>
          <div className="section-head">
            <h2>我写的攻略</h2>
            <Link href="/guides/new">写一篇</Link>
          </div>
          {guides.length ? (
            <ul className="my-guides">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <Link href={`/guides/${guide.id}`}>
                    <span>
                      {guide.destination} · {guide.title}
                    </span>
                    <span className="meta">{guide.commentCount} 条留言</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="help">还没有发表过攻略。</p>
          )}
        </section>
        <LogoutButton />
        <Footer demo={isDemoMode()} />
      </div>
    </div>
  );
}
