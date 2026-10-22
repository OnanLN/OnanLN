"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { formatWhen } from "@/lib/format";
import { sendJson } from "@/lib/request";
import type { CommentNode } from "@/lib/tree";

function countNodes(nodes: CommentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.replies), 0);
}

export function CommentSection({
  guideId,
  comments,
  currentUserId,
}: {
  guideId: number;
  comments: CommentNode[];
  currentUserId: number | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const loginHref = `/login?next=/guides/${guideId}`;

  async function submit(text: string, parentId: number | null) {
    setError("");
    setPending(true);
    try {
      await sendJson(`/api/guides/${guideId}/comments`, "POST", { body: text, parentId });
      setBody("");
      setReplyBody("");
      setReplyTo(null);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "留言没有发出去");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("删除后，下面的回复也会一起消失。确定删除这条留言？")) return;
    setError("");
    try {
      await sendJson(`/api/comments/${id}`, "DELETE");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "没有删除成功");
    }
  }

  return (
    <section className="comments" id="comments">
      <header className="section-head">
        <h2>留言</h2>
        <span>{countNodes(comments)} 条</span>
      </header>
      {currentUserId ? (
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(body, null);
          }}
        >
          <label className="field">
            <span>写一条留言</span>
            <textarea
              value={body}
              maxLength={500}
              rows={3}
              placeholder="补充路况、花费，或者你去过之后不一样的地方。"
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
          <div className="composer-bar">
            <span className="counter">
              {body.trim().length}/500
            </span>
            <button className="btn btn-sienna btn-small" type="submit" disabled={pending || !body.trim()}>
              {pending ? "发送中" : "发送留言"}
            </button>
          </div>
        </form>
      ) : (
        <p className="login-hint">
          <Link href={loginHref}>登录</Link>
          之后可以留言，也可以回复别人。
        </p>
      )}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="thread">
        {comments.length ? (
          comments.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              currentUserId={currentUserId}
              replyTo={replyTo}
              replyBody={replyBody}
              pending={pending}
              onReply={(id, name) => {
                setReplyTo({ id, name });
                setReplyBody("");
              }}
              onReplyBody={setReplyBody}
              onCancel={() => setReplyTo(null)}
              onSubmit={(text, parentId) => submit(text, parentId)}
              onDelete={remove}
            />
          ))
        ) : (
          <p className="help">还没有留言。第一条通常最有用。</p>
        )}
      </div>
    </section>
  );
}

function CommentItem({
  node,
  depth,
  currentUserId,
  replyTo,
  replyBody,
  pending,
  onReply,
  onReplyBody,
  onCancel,
  onSubmit,
  onDelete,
}: {
  node: CommentNode;
  depth: number;
  currentUserId: number | null;
  replyTo: { id: number; name: string } | null;
  replyBody: string;
  pending: boolean;
  onReply: (id: number, name: string) => void;
  onReplyBody: (value: string) => void;
  onCancel: () => void;
  onSubmit: (text: string, parentId: number) => void;
  onDelete: (id: number) => void;
}) {
  const replying = replyTo?.id === node.id;
  return (
    <article className="comment" style={{ marginLeft: Math.min(depth, 4) * 14 }}>
      <header>
        <Avatar name={node.authorName} id={node.authorId} size={32} />
        <div>
          <strong>{node.authorName}</strong>
          <time dateTime={new Date(node.createdAt).toISOString()}>{formatWhen(node.createdAt)}</time>
        </div>
      </header>
      <p className="comment-body">{node.body}</p>
      <div className="comment-actions">
        {currentUserId ? (
          <button type="button" onClick={() => onReply(node.id, node.authorName)}>
            回复
          </button>
        ) : null}
        {currentUserId === node.authorId ? (
          <button type="button" onClick={() => onDelete(node.id)}>
            删除
          </button>
        ) : null}
      </div>
      {replying ? (
        <form
          className="reply-box"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(replyBody, node.id);
          }}
        >
          <label className="field">
            <span>回复 {node.authorName}</span>
            <textarea
              value={replyBody}
              maxLength={500}
              rows={3}
              autoFocus
              onChange={(event) => onReplyBody(event.target.value)}
            />
          </label>
          <div className="composer-bar">
            <button type="button" className="btn btn-small btn-ghost" onClick={onCancel}>
              取消
            </button>
            <button className="btn btn-small btn-sienna" type="submit" disabled={pending || !replyBody.trim()}>
              发送回复
            </button>
          </div>
        </form>
      ) : null}
      {node.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          node={reply}
          depth={depth + 1}
          currentUserId={currentUserId}
          replyTo={replyTo}
          replyBody={replyBody}
          pending={pending}
          onReply={onReply}
          onReplyBody={onReplyBody}
          onCancel={onCancel}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      ))}
    </article>
  );
}
