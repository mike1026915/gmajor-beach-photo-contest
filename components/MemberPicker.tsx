"use client";

import { useEffect, useState } from "react";
import { getMember, MEMBERS } from "@/lib/members";

const STORAGE_KEY = "memberId";

// 記住上次選的名字（存在瀏覽器 localStorage）
export function useMemberId(): [string, (id: string) => void] {
  const [memberId, setMemberIdState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? "";
    // localStorage 只有瀏覽器讀得到，SSR 首次渲染後回填一次
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && getMember(saved)) setMemberIdState(saved);
  }, []);

  const setMemberId = (id: string) => {
    setMemberIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  return [memberId, setMemberId];
}

function ChangeMemberDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-member-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="change-member-title" className="text-lg font-bold text-slate-800">
          變更身份？
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          變更後需要重新選擇名字，才能上傳或投票。
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 py-2.5 font-medium text-slate-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-sky-600 py-2.5 font-medium text-white"
          >
            確定變更
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemberPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const member = value ? getMember(value) : undefined;

  if (member) {
    return (
      <>
        <div className="block">
          <span className="text-sm font-medium text-slate-600">{label}</span>
          <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3">
            <span className="text-base">{member.name}</span>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-sm font-medium text-sky-600"
            >
              變更
            </button>
          </div>
        </div>
        {confirmOpen && (
          <ChangeMemberDialog
            onConfirm={() => {
              onChange("");
              setConfirmOpen(false);
            }}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"
      >
        <option value="">請選擇…</option>
        {MEMBERS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}
