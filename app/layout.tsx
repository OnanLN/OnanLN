import type { Metadata, Viewport } from "next";
import { Newsreader, Outfit } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "途记 · 把路线钉在地图上",
    template: "%s · 途记",
  },
  description: "记录不同目的地的旅行攻略，在同一张地图上查看、评论，并与旅伴共享位置。",
  applicationName: "途记",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3eee4",
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="zh-CN" className={`${newsreader.variable} ${outfit.variable}`}>
      <body>
        <a className="skip" href="#content">
          跳到内容
        </a>
        <SiteHeader user={user ? { nickname: user.nickname } : null} />
        <main>{children}</main>
      </body>
    </html>
  );
}
