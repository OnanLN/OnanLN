import { LoginForm } from "@/components/LoginForm";
import { isDemoMode } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/me";
  return (
    <div className="page-scroll" id="content">
      <div className="login-grid">
        <section className="login-pitch">
          <p className="eyebrow">途记</p>
          <h1>下一次出发之前，先看别人怎么走过。</h1>
          <ul>
            <li>攻略钉在同一张地图上，点开就能读。</li>
            <li>留言可以再回复，把路况补在原话下面。</li>
            <li>共享的位置只保留 24 小时，也可以模糊到大约一公里。</li>
          </ul>
        </section>
        <LoginForm nextPath={nextPath} demo={isDemoMode()} />
      </div>
    </div>
  );
}
