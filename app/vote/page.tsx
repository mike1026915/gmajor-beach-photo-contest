"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMemberId } from "@/components/MemberPicker";
import { apiFetch } from "@/lib/api-client";
import { getMember, MAX_VOTES } from "@/lib/members";

type WallPhoto = { id: string; url: string; mine: boolean };
type Wall = { uploadsOpen: boolean; votingOpen: boolean; photos: WallPhoto[] };
// forMember：標記這份資料屬於哪個人，切換名字時自然失效，不用手動清空
type WallState = Wall & { forMember: string };

export default function VotePage() {
  const [memberId] = useMemberId();
  const [wall, setWall] = useState<WallState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<WallPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!memberId) return;
    Promise.all([
      apiFetch<Wall>(`/api/photos?member=${encodeURIComponent(memberId)}`),
      apiFetch<{ votingOpen: boolean; photoIds: string[] }>(
        `/api/votes?voter=${encodeURIComponent(memberId)}`
      ),
    ])
      .then(([w, v]) => {
        setWall({ ...w, forMember: memberId });
        const valid = v.photoIds.filter((pid) =>
          w.photos.some((p) => p.id === pid)
        );
        setSelected(valid);
        setSaved(valid);
      })
      .catch((err) => {
        setMessage({
          kind: "err",
          text: err instanceof Error ? err.message : "載入失敗，請重新整理",
        });
      });
  }, [memberId]);

  const view = wall && wall.forMember === memberId ? wall : null;

  function toggle(photo: WallPhoto) {
    if (!view?.votingOpen || photo.mine) return;
    if (selected.includes(photo.id)) {
      setSelected(selected.filter((x) => x !== photo.id));
      setMessage(null);
      return;
    }
    if (selected.length >= MAX_VOTES) {
      setMessage({
        kind: "err",
        text: `最多只能投 ${MAX_VOTES} 票，先取消一張再選吧。`,
      });
      return;
    }
    setSelected([...selected, photo.id]);
    setMessage(null);
  }

  async function submit() {
    if (!memberId) return;
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterMemberId: memberId, photoIds: selected }),
      });
      setSaved(selected);
      setMessage({ kind: "ok", text: "投票成功！截止前都可以回來改票。" });
    } catch (err) {
      setMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "送出失敗，請再試一次",
      });
    } finally {
      setBusy(false);
    }
  }

  const dirty =
    selected.length !== saved.length || selected.some((id) => !saved.includes(id));

  return (
    <main className="mx-auto max-w-md px-5 py-6 pb-32">
      <header className="flex items-center gap-3">
        <Link href="/" className="text-sm text-slate-500">
          ← 回首頁
        </Link>
        <h1 className="text-xl font-bold">我要投票</h1>
      </header>

      {!memberId && (
        <p className="mt-8 text-center text-slate-500">
          請先
          <Link href="/" className="mx-1 text-sky-600 underline">
            回首頁
          </Link>
          選擇你的名字，就可以投給最喜歡的 {MAX_VOTES} 張照片。
        </p>
      )}

      {memberId && getMember(memberId) && (
        <div className="mt-5">
          <p className="text-sm text-slate-500">
            目前身份：{getMember(memberId)!.name}
            <Link href="/" className="ml-2 text-sky-600 underline">
              更換
            </Link>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            選名字只是讓你之後可以改票；你投給誰不會公開，大家也看不到票數。
          </p>
        </div>
      )}

      {memberId && view && !view.votingOpen && (
        <div className="mt-5 rounded-xl bg-amber-100 px-4 py-3 text-amber-800">
          投票已截止。
        </div>
      )}

      {message && (
        <div
          className={`mt-5 rounded-xl px-4 py-3 ${
            message.kind === "ok"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {memberId && view && view.photos.length === 0 && (
        <p className="mt-8 text-center text-slate-500">還沒有人上傳照片。</p>
      )}

      {memberId && view && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {view.photos.map((p) => {
            const isSelected = selected.includes(p.id);
            return (
              <div key={p.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  disabled={p.mine || !view.votingOpen}
                  className={`block w-full rounded-xl ${
                    isSelected ? "ring-4 ring-sky-500" : ""
                  } ${p.mine ? "opacity-60" : ""}`}
                >
                  <img
                    src={p.url}
                    alt="參賽照片"
                    loading="lazy"
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                </button>
                {p.mine && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs text-white">
                    自己的作品
                  </span>
                )}
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
                    ✓
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setLightbox(p)}
                  aria-label="放大照片"
                  className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white"
                >
                  ⤢
                </button>
              </div>
            );
          })}
        </div>
      )}

      {memberId && view && view.votingOpen && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between gap-4">
            <span className="font-medium">
              已選 {selected.length} / {MAX_VOTES}
              {dirty && (
                <span className="ml-1 text-sm text-amber-600">（尚未送出）</span>
              )}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={busy || !dirty}
              className="rounded-xl bg-sky-600 px-6 py-2.5 font-bold text-white disabled:opacity-40"
            >
              {busy ? "送出中…" : dirty ? "送出投票" : "已送出"}
            </button>
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt="參賽照片"
            className="max-h-[75dvh] w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="mt-4 flex justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {!lightbox.mine && view?.votingOpen && (
              <button
                type="button"
                onClick={() => toggle(lightbox)}
                className="rounded-xl bg-sky-600 px-6 py-2.5 font-bold text-white"
              >
                {selected.includes(lightbox.id) ? "取消這張" : "投這張"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="rounded-xl bg-white/20 px-6 py-2.5 font-medium text-white"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
