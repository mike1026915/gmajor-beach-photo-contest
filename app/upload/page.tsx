"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMemberId } from "@/components/MemberPicker";
import { apiFetch } from "@/lib/api-client";
import { getMember, MAX_PHOTOS } from "@/lib/members";

type MyPhoto = { id: string; slot: number; url: string };
type MyPhotos = { uploadsOpen: boolean; photos: MyPhoto[] };
// forMember：標記這份資料屬於哪個人，切換名字時自然失效，不用手動清空
type MyPhotosState = MyPhotos & { forMember: string };

export default function UploadPage() {
  const [memberId] = useMemberId();
  const [data, setData] = useState<MyPhotosState | null>(null);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<number | null>(null);

  const refresh = useCallback(async (id: string) => {
    const d = await apiFetch<MyPhotos>(
      `/api/my-photos?member=${encodeURIComponent(id)}`
    );
    setData({ ...d, forMember: id });
  }, []);

  useEffect(() => {
    if (!memberId) return;
    apiFetch<MyPhotos>(`/api/my-photos?member=${encodeURIComponent(memberId)}`)
      .then((d) => setData({ ...d, forMember: memberId }))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "載入失敗")
      );
  }, [memberId]);

  function pickFile(slot: number, replacing: boolean) {
    if (
      replacing &&
      !confirm("替換後，這張照片原本得到的票會作廢，確定要替換嗎？")
    ) {
      return;
    }
    pendingSlot.current = slot;
    fileInputRef.current?.click();
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const slot = pendingSlot.current;
    pendingSlot.current = null;
    if (!file || slot == null || !memberId) return;

    setBusySlot(slot);
    setError(null);
    try {
      const imageCompression = (await import("browser-image-compression")).default;
      let upload: File = file;
      try {
        upload = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.85,
        });
      } catch {
        // 壓縮失敗就傳原檔（伺服器端仍有 4MB 上限會擋）
      }
      const form = new FormData();
      form.set("memberId", memberId);
      form.set("slot", String(slot));
      form.set("file", upload, "photo.jpg");
      await apiFetch("/api/photos", { method: "POST", body: form });
      await refresh(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗，請再試一次");
    } finally {
      setBusySlot(null);
    }
  }

  async function deletePhoto(photo: MyPhoto) {
    if (!confirm("確定刪除這張照片嗎？它得到的票也會一併作廢。")) return;
    setBusySlot(photo.slot);
    setError(null);
    try {
      await apiFetch(
        `/api/photos/${photo.id}?member=${encodeURIComponent(memberId)}`,
        { method: "DELETE" }
      );
      await refresh(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗，請再試一次");
    } finally {
      setBusySlot(null);
    }
  }

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => i + 1);
  const current = data && data.forMember === memberId ? data : null;
  const uploadsOpen = current?.uploadsOpen ?? true;

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/" className="text-sm text-slate-500">
          ← 回首頁
        </Link>
        <h1 className="text-xl font-bold">上傳照片</h1>
      </header>

      {!memberId && (
        <p className="mt-8 text-center text-slate-500">
          請先
          <Link href="/" className="mx-1 text-sky-600 underline">
            回首頁
          </Link>
          選擇你的名字，就可以上傳最多 {MAX_PHOTOS} 張照片。
        </p>
      )}

      {memberId && getMember(memberId) && (
        <p className="mt-5 text-sm text-slate-500">
          目前身份：{getMember(memberId)!.name}
          <Link href="/" className="ml-2 text-sky-600 underline">
            更換
          </Link>
        </p>
      )}

      {memberId && current && !uploadsOpen && (
        <div className="mt-5 rounded-xl bg-amber-100 px-4 py-3 text-amber-800">
          上傳已截止，目前無法新增、替換或刪除照片。
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {memberId && current && (
        <div className="mt-5 flex flex-col gap-4">
          {slots.map((slot) => {
            const photo = current.photos.find((p) => p.slot === slot);
            const busy = busySlot === slot;
            return (
              <div key={slot} className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="mb-2 text-sm font-medium text-slate-500">
                  第 {slot} 張
                </p>
                {photo ? (
                  <>
                    <div className="relative">
                      <img
                        src={photo.url}
                        alt={`第 ${slot} 張照片`}
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      {busy && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 font-medium text-white">
                          處理中…
                        </div>
                      )}
                    </div>
                    {uploadsOpen && (
                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() => pickFile(slot, true)}
                          disabled={busy}
                          className="flex-1 rounded-xl bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50"
                        >
                          替換
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo)}
                          disabled={busy}
                          className="flex-1 rounded-xl bg-red-50 py-2.5 font-medium text-red-600 disabled:opacity-50"
                        >
                          刪除
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => pickFile(slot, false)}
                    disabled={!uploadsOpen || busy}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 disabled:opacity-50"
                  >
                    {busy ? (
                      <span className="font-medium text-slate-500">上傳中…</span>
                    ) : (
                      <>
                        <span className="text-4xl">＋</span>
                        <span className="mt-1 font-medium">上傳照片</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChosen}
      />
    </main>
  );
}
