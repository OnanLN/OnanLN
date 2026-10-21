"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/request";

export function DeleteGuideButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <span className="delete-wrap">
      <button
        type="button"
        className="btn btn-small btn-danger"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm("删除后，留言也会一起消失。确定删除这篇攻略？")) return;
          setPending(true);
          setError("");
          try {
            await sendJson(`/api/guides/${id}`, "DELETE");
            router.push("/guides");
            router.refresh();
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "没有删除成功");
            setPending(false);
          }
        }}
      >
        {pending ? "删除中" : "删除"}
      </button>
      {error ? <span className="form-error">{error}</span> : null}
    </span>
  );
}
