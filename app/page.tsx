"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Wall = { uploadsOpen: boolean; votingOpen: boolean; photos: unknown[] };

function StatusChip({ label, open }: { label: string; open: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        open ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
      }`}
    >
      {label}：{open ? "開放中" : "已截止"}
    </span>
  );
}

export default function HomePage() {
  const [wall, setWall] = useState<Wall | null>(null);

  useEffect(() => {
    apiFetch<Wall>("/api/photos")
      .then(setWall)
      .catch(() => setWall(null));
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="text-center">
        <div className="flex justify-center">
          <img
            src="/192x192.jpg"
            alt="漂亮一夏！G大調福隆攝影比賽"
            className="w-24 h-24"
          />
        </div>

        <h1 className="mt-3 text-3xl font-bold">漂亮一夏！</h1>
        <h1 className="mt-3 text-3xl font-bold">G大調福隆攝影比賽</h1>
        <p className="mt-2 text-slate-500">
          上傳你的得意之作，投給最喜歡的照片！
        </p>
      </div>

      {wall && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <StatusChip label="上傳" open={wall.uploadsOpen} />
          <StatusChip label="投票" open={wall.votingOpen} />
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
            目前 {wall.photos.length} 張照片
          </span>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-4">
        <Link
          href="/upload"
          className="rounded-2xl bg-sky-600 px-6 py-5 text-center text-xl font-bold text-white shadow-lg shadow-sky-600/20 active:bg-sky-700"
        >
          📤 上傳照片
        </Link>
        <Link
          href="/vote"
          className="rounded-2xl bg-amber-500 px-6 py-5 text-center text-xl font-bold text-white shadow-lg shadow-amber-500/20 active:bg-amber-600"
        >
          🗳️ 我要投票
        </Link>
      </div>

      <footer className="mt-auto pt-12 text-center">
        <Link href="/admin" className="text-xs text-slate-400 underline">
          管理者入口
        </Link>
      </footer>
    </main>
  );
}
