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
  };

  return [memberId, setMemberId];
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
