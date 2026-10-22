"use client";

import { useId } from "react";
import { isTheme, type CoverTheme } from "@/lib/themes";

function Sky({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={from} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  );
}

function ThemeShape({ theme, id }: { theme: CoverTheme; id: string }) {
  const sky = `${id}-sky`;
  switch (theme) {
    case "lake":
      return (
        <>
          <defs>
            <Sky id={sky} from="#f6d2b8" to="#7eafc2" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <circle cx="590" cy="140" r="58" fill="#fff4df" />
          <path d="M0 292 140 246 250 286 390 220 520 292 800 236v120H0Z" fill="#355f73" />
          <path d="M0 340h800v180H0Z" fill="#d8f0ea" />
          <path d="M0 410c150-36 250 28 400 8s250 24 400-12v114H0Z" fill="#8eb8c4" />
        </>
      );
    case "forest":
      return (
        <>
          <defs>
            <Sky id={sky} from="#d5e4d2" to="#1d463f" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <circle cx="150" cy="96" r="28" fill="#f4f7ef" />
          <path d="M40 430 150 180l110 250Z" fill="#16352f" />
          <path d="M180 450 320 140l130 310Z" fill="#1f5c49" />
          <path d="M360 450 500 190l120 260Z" fill="#14312c" />
          <path d="M520 460 650 230l130 230Z" fill="#1b4a3d" />
          <path d="M0 430h800v90H0Z" fill="#102824" />
          <path d="M0 470c180-40 280 20 460-8 120-18 220 10 340 6v52H0Z" fill="#7fafa3" />
        </>
      );
    case "market":
      return (
        <>
          <defs>
            <Sky id={sky} from="#f3c09a" to="#6d3a48" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <path d="M40 250h180l-20 150H60Z" fill="#c4481d" />
          <path d="M230 220h200l-24 180H254Z" fill="#f6f1e7" />
          <path d="M450 240h210l-16 160H470Z" fill="#1c1712" />
          <path d="M70 250c40-70 120-70 160 0" fill="none" stroke="#8d3012" strokeWidth="18" />
          <path d="M250 220c50-80 150-80 190 0" fill="none" stroke="#c8923a" strokeWidth="18" />
          <circle cx="120" cy="150" r="8" fill="#f6e2a8" />
          <circle cx="220" cy="130" r="7" fill="#f6e2a8" />
          <circle cx="340" cy="120" r="8" fill="#f6e2a8" />
          <circle cx="520" cy="146" r="7" fill="#f6e2a8" />
          <circle cx="640" cy="128" r="8" fill="#f6e2a8" />
          <path d="M0 430h800v90H0Z" fill="#24181a" />
        </>
      );
    case "river":
      return (
        <>
          <defs>
            <Sky id={sky} from="#f7e3c6" to="#8fb8c8" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <path d="M40 360c70-180 150-180 190-20 10 40-20 80-70 80s-90-20-120-60Z" fill="#2f5c54" />
          <path d="M250 390c80-220 180-230 230-10 8 36-30 70-90 70s-110-16-140-60Z" fill="#214840" />
          <path d="M520 370c60-160 140-160 170-8 6 30-24 62-74 62s-80-18-96-54Z" fill="#3d6d62" />
          <path d="M0 400h800v120H0Z" fill="#d7efe8" />
          <path d="M90 455h70v8H90z" fill="#1c1712" />
          <path d="M70 463h120l-14 16H84Z" fill="#c4481d" />
        </>
      );
    case "oldtown":
      return (
        <>
          <defs>
            <Sky id={sky} from="#f4c7a4" to="#7d4452" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <path d="M70 300 180 210 290 300v150H70Z" fill="#5a3038" />
          <path d="M250 320 390 214 530 320v130H250Z" fill="#1c1712" />
          <path d="M500 286 640 190 760 286v164H500Z" fill="#6e3a44" />
          <path d="M70 300h220" stroke="#2a181c" strokeWidth="10" />
          <rect x="150" y="330" width="28" height="40" fill="#f2c07a" />
          <rect x="360" y="348" width="26" height="36" fill="#f2c07a" />
          <rect x="600" y="330" width="24" height="34" fill="#f2c07a" />
          <circle cx="430" cy="250" r="18" fill="#e8843a" />
          <path d="M430 232v52" stroke="#f6e2c4" strokeWidth="4" />
        </>
      );
    case "mountain":
      return (
        <>
          <defs>
            <Sky id={sky} from="#f6d7c8" to="#6d86b0" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <path d="M40 470 250 120l150 210 40-70 210 210Z" fill="#f7f4ef" />
          <path d="M180 470 430 150l230 320Z" fill="#61758f" />
          <path d="M0 430 180 300l120 80 160-40 180 40 160-70v170H0Z" fill="#243246" />
          <path d="M0 470h800v50H0Z" fill="#1f5c49" />
        </>
      );
    case "coast":
      return (
        <>
          <defs>
            <Sky id={sky} from="#f8e6d4" to="#6ea3c4" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <circle cx="180" cy="150" r="48" fill="#fff1df" />
          <path d="M0 250h260l80 270H0Z" fill="#cbb89a" />
          <path d="M0 360h800v160H0Z" fill="#1f5f78" />
          <path d="M0 410c120-30 200 20 340 0s220 16 460-8v118H0Z" fill="#d5eee9" />
          <path d="M0 450c160 24 240-20 400 0s220-10 400 16v54H0Z" fill="#2f7590" />
        </>
      );
    case "desert":
      return (
        <>
          <defs>
            <Sky id={sky} from="#f6c48a" to="#d06a3e" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <circle cx="620" cy="110" r="36" fill="#fff6e8" />
          <path d="M0 340c140-90 230-90 340-10 70 50 40 20 40 20L0 470Z" fill="#e39a55" />
          <path d="M180 400c150-120 280-90 420-8 40 24 20 10 20 10L120 500Z" fill="#c46a32" />
          <path d="M0 460c180-70 300-40 470-8 90 16 180 8 330-20v88H0Z" fill="#8d4322" />
        </>
      );
    case "garden":
      return (
        <>
          <defs>
            <Sky id={sky} from="#e7f0e4" to="#f0d2cc" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <path d="M0 300h800v220H0Z" fill="#b7d4cf" />
          <path d="M120 300c40 70 160 70 200 0" fill="none" stroke="#1c1712" strokeWidth="16" />
          <path d="M150 300v70M290 300v70" stroke="#1c1712" strokeWidth="10" />
          <path d="M520 120c80 40 90 160 20 250" fill="none" stroke="#1f5c49" strokeWidth="14" />
          <path d="M520 180c70 10 110 70 90 130" fill="none" stroke="#2f6b52" strokeWidth="8" />
          <circle cx="250" cy="390" r="10" fill="#f4d2d8" />
          <circle cx="430" cy="420" r="8" fill="#f4d2d8" />
          <circle cx="360" cy="450" r="7" fill="#fff" />
        </>
      );
    case "harbor":
      return (
        <>
          <defs>
            <Sky id={sky} from="#d7e5ef" to="#f2d7c2" />
          </defs>
          <rect width="800" height="520" fill={`url(#${sky})`} />
          <path d="M0 300h800v220H0Z" fill="#3d6e86" />
          <path d="M0 360c140 30 260-10 400 8 150 18 240-16 400-4v156H0Z" fill="#d5e4ea" />
          <rect x="560" y="150" width="36" height="180" fill="#f4efe6" />
          <path d="M542 150h72L578 96Z" fill="#c4481d" />
          <rect x="574" y="188" width="10" height="16" fill="#1c1712" />
          <path d="M40 330h430v16H40Z" fill="#1c1712" />
          <path d="M180 300 230 346H150Z" fill="#fffdf8" />
          <path d="M300 292 360 346H250Z" fill="#f6e2c8" />
        </>
      );
    default:
      return <rect width="800" height="520" fill="#d7c4a8" />;
  }
}

export function CoverArt({ theme, className }: { theme: string; className?: string }) {
  const reactId = useId().replace(/:/g, "");
  const safe = isTheme(theme) ? theme : "lake";
  return (
    <svg
      className={className ? `cover-art ${className}` : "cover-art"}
      viewBox="0 0 800 520"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <ThemeShape theme={safe} id={reactId} />
    </svg>
  );
}
