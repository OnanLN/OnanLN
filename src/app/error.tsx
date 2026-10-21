"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page narrow">
      <h2>这一页没有停稳。</h2>
      <button className="btn btn-ink" type="button" onClick={reset}>再试一次</button>
    </div>
  );
}
