"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page-scroll" id="content">
      <div className="empty-page">
        <div>
          <h1>这一页没有展开</h1>
          <p className="help">可能是网络晃了一下。再试一次通常就好。</p>
          <button className="btn" type="button" onClick={() => reset()}>
            重新加载
          </button>
        </div>
      </div>
    </div>
  );
}
