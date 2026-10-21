import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-scroll" id="content">
      <div className="empty-page">
        <div>
          <p className="eyebrow">404</p>
          <h1>这页路还没人走过</h1>
          <p className="help">地址可能写错了，或者这篇攻略已经被作者收起来。</p>
          <Link className="btn" href="/">
            回到地图
          </Link>
        </div>
      </div>
    </div>
  );
}
