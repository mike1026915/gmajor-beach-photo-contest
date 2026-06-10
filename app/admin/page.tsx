"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

const PASSWORD_HEADER = "x-admin-password";
const STORAGE_KEY = "adminPassword";

type VoteChoice = { memberName: string; slot: number };
type VoteLogEntry = { voterName: string; votedFor: VoteChoice[] };
type ResultRow = {
  id: string;
  url: string;
  memberName: string;
  slot: number;
  votes: number;
  voters: string[];
};
type Results = {
  uploadsOpen: boolean;
  votingOpen: boolean;
  voterCount: number;
  voteLog: VoteLogEntry[];
  results: ResultRow[];
};

function formatVoteChoice({ memberName, slot }: VoteChoice) {
  return `${memberName}（第 ${slot} 張）`;
}

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [data, setData] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(pw: string) {
    setBusy(true);
    setError(null);
    try {
      const d = await apiFetch<Results>("/api/admin/results", {
        headers: { [PASSWORD_HEADER]: pw },
      });
      setData(d);
      setPassword(pw);
      sessionStorage.setItem(STORAGE_KEY, pw);
    } catch (err) {
      setData(null);
      setPassword(null);
      sessionStorage.removeItem(STORAGE_KEY);
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setBusy(false);
    }
  }

  // 同一個瀏覽器分頁內免重複輸入密碼
  useEffect(() => {
    const pw = sessionStorage.getItem(STORAGE_KEY);
    if (!pw) return;
    apiFetch<Results>("/api/admin/results", {
      headers: { [PASSWORD_HEADER]: pw },
    })
      .then((d) => {
        setData(d);
        setPassword(pw);
      })
      .catch(() => sessionStorage.removeItem(STORAGE_KEY));
  }, []);

  async function toggleSetting(key: "uploadsOpen" | "votingOpen") {
    if (!password || !data) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetch<{ uploadsOpen: boolean; votingOpen: boolean }>(
        "/api/admin/settings",
        {
          method: "PATCH",
          headers: {
            [PASSWORD_HEADER]: password,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [key]: !data[key] }),
        }
      );
      setData({ ...data, ...updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setBusy(false);
    }
  }

  async function deletePhoto(row: ResultRow) {
    if (!password) return;
    if (!confirm(`確定刪除「${row.memberName}」的這張照片嗎？票數會一併刪除。`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/photos/${row.id}`, {
        method: "DELETE",
        headers: { [PASSWORD_HEADER]: password },
      });
      await load(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword(null);
    setData(null);
    setInput("");
  }

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/" className="text-sm text-slate-500">
          ← 回首頁
        </Link>
        <h1 className="text-xl font-bold">管理者頁面</h1>
      </header>

      {error && (
        <div className="mt-5 rounded-xl bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {!data && (
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (input) void load(input);
          }}
        >
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="管理密碼"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
          <button
            type="submit"
            disabled={busy || !input}
            className="rounded-xl bg-slate-900 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "登入中…" : "登入"}
          </button>
        </form>
      )}

      {data && password && (
        <>
          <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-bold">活動開關</h2>
            {(
              [
                ["uploadsOpen", "開放上傳"],
                ["votingOpen", "開放投票"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="mt-3 flex items-center justify-between">
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => toggleSetting(key)}
                  disabled={busy}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50 ${
                    data[key] ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                >
                  {data[key] ? "開放中" : "已關閉"}
                </button>
              </div>
            ))}
          </section>

          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">
                票數排行
                <span className="ml-2 text-sm font-normal text-slate-500">
                  已有 {data.voterCount} 人投票
                </span>
              </h2>
              <button
                type="button"
                onClick={() => void load(password)}
                disabled={busy}
                className="text-sm text-sky-600 disabled:opacity-50"
              >
                重新整理
              </button>
            </div>

            {data.results.length === 0 && (
              <p className="mt-4 text-center text-slate-500">還沒有照片。</p>
            )}

            <ul className="mt-3 divide-y divide-slate-100">
              {data.results.map((row, i) => (
                <li key={row.id} className="flex items-center gap-3 py-3">
                  <span className="w-6 text-center font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <a href={row.url} target="_blank" rel="noreferrer">
                    <img
                      src={row.url}
                      alt={`${row.memberName} 的照片`}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </a>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{row.memberName}</p>
                    <p className="text-sm text-slate-500">第 {row.slot} 張</p>
                    {row.voters.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        投票者：{row.voters.join("、")}
                      </p>
                    )}
                  </div>
                  <span className="text-lg font-bold text-sky-600">
                    {row.votes} 票
                  </span>
                  <button
                    type="button"
                    onClick={() => deletePhoto(row)}
                    disabled={busy}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-50"
                  >
                    刪除
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-bold">投票明細</h2>
            <p className="mt-1 text-sm text-slate-500">每位團員投了哪些照片</p>

            {data.voteLog.length === 0 && (
              <p className="mt-4 text-center text-slate-500">還沒有人投票。</p>
            )}

            <ul className="mt-3 divide-y divide-slate-100">
              {data.voteLog.map((entry) => (
                <li key={entry.voterName} className="py-3">
                  <p className="font-medium">{entry.voterName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    → {entry.votedFor.map(formatVoteChoice).join("、")}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            onClick={logout}
            className="mt-6 w-full text-center text-sm text-slate-400 underline"
          >
            登出
          </button>
        </>
      )}
    </main>
  );
}
