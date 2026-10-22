"use client";

import { useEffect, useState } from "react";

type Props = {
  title: string;
  summary: string;
  path: string;
};

export function ShareSheet({ title, summary, path }: Props) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const [inWeChat, setInWeChat] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setCanNative(typeof navigator.share === "function");
    setInWeChat(/MicroMessenger/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function pageUrl() {
    return `${window.location.origin}${path}`;
  }

  async function openWeChat() {
    setCopied(false);
    setNote("");
    setOpen(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(pageUrl(), {
        margin: 1,
        width: 280,
        color: { dark: "#1c1712", light: "#fffdf8" },
      });
      setQr(url);
    } catch {
      setQr(null);
      setNote("二维码没有生成，可以先复制链接发到微信。");
    }
  }

  function openWindow(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareQq() {
    const share = new URL("https://connect.qq.com/widget/shareqq/index.html");
    share.searchParams.set("url", pageUrl());
    share.searchParams.set("title", title);
    share.searchParams.set("summary", summary);
    openWindow(share.toString());
  }

  function shareWeibo() {
    const share = new URL("https://service.weibo.com/share/share.php");
    share.searchParams.set("url", pageUrl());
    share.searchParams.set("title", `${title} ${summary}`);
    openWindow(share.toString());
  }

  async function copy() {
    const url = pageUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "true");
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setNote("链接已复制");
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: summary, url: pageUrl() });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNote("系统分享没有完成，可以改用复制链接。");
      setOpen(true);
    }
  }

  return (
    <div className="share-block">
      <div className="share-row" aria-label="分享这篇攻略">
        <button type="button" className="btn btn-small" onClick={openWeChat}>
          微信
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={shareQq}>
          QQ
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={shareWeibo}>
          微博
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={copy}>
          {copied ? "已复制" : "复制链接"}
        </button>
        {canNative ? (
          <button type="button" className="btn btn-small btn-ghost" onClick={nativeShare}>
            系统分享
          </button>
        ) : null}
      </div>
      {note && !open ? (
        <p className="help" role="status">
          {note}
        </p>
      ) : null}
      {open ? (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wechat-share-title">
          <button type="button" className="modal-backdrop" aria-label="关闭" onClick={() => setOpen(false)} />
          <div className="sheet-card">
            <div className="sheet-head">
              <h2 id="wechat-share-title">分享到微信</h2>
              <button type="button" className="btn btn-small btn-ghost" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
            {inWeChat ? (
              <p>你正在微信里打开这页。点右上角「···」，可以发送给朋友或分享到朋友圈。</p>
            ) : (
              <p>用微信扫一扫打开这篇攻略，再点右上角分享。网页本身不能直接唤起微信好友列表，那需要已认证的公众号。</p>
            )}
            {qr ? <img className="qr" src={qr} alt="这篇攻略的微信二维码" /> : null}
            <p className="link-preview">{typeof window === "undefined" ? path : pageUrl()}</p>
            <button type="button" className="btn btn-sienna" onClick={copy}>
              {copied ? "链接已复制" : "复制链接"}
            </button>
            {note ? (
              <p className="help" role="status">
                {note}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
