"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function active(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/guides") {
    return pathname === "/guides" || (/^\/guides\/\d+/.test(pathname) && !pathname.endsWith("/edit"));
  }
  if (href === "/guides/new") return pathname.startsWith("/guides/new") || pathname.endsWith("/edit");
  if (href === "/me") return pathname.startsWith("/me") || pathname.startsWith("/login");
  return pathname === href;
}

const LINKS = [
  { href: "/", label: "地图" },
  { href: "/guides", label: "攻略" },
  { href: "/guides/new", label: "写攻略" },
];

export function SiteHeader({ user }: { user: { nickname: string } | null }) {
  const pathname = usePathname();
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>
            途
          </span>
          <span className="brand-text">
            <strong>途记</strong>
            <small>地图上的旅行手记</small>
          </span>
        </Link>
        <nav className="topnav" aria-label="主导航">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} data-active={active(link.href, pathname) ? "true" : "false"}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="top-actions">
          {user ? (
            <Link href="/me" className="userchip">
              {user.nickname}
            </Link>
          ) : (
            <Link href="/login" className="btn btn-small">
              登录
            </Link>
          )}
        </div>
      </header>
      <nav className="bottomnav" aria-label="手机导航">
        {[
          ...LINKS,
          { href: "/me", label: "我的" },
        ].map((link) => (
          <Link key={link.href} href={link.href} data-active={active(link.href, pathname) ? "true" : "false"}>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
