import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page narrow">
      <p className="eyebrow">404</p>
      <h2 style={{ fontSize: 48 }}>这个车位编号不存在。</h2>
      <Link className="btn btn-ink" href="/">回到地图</Link>
    </div>
  );
}
