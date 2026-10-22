import Link from "next/link";

export function Footer({ demo = false }: { demo?: boolean }) {
  return (
    <footer className="site-footer">
      <p>攻略由旅人撰写。出发前再核对当地天气、交通、门票和身体状况。</p>
      {demo ? <p>当前是演示环境，短信验证码不会真正发送，也不会产生短信费用。</p> : null}
      <nav>
        <Link href="/about">关于途记</Link>
        <Link href="/guides/new">写一篇攻略</Link>
      </nav>
    </footer>
  );
}
