// 前端共用：呼叫 API 並把後端的 error 訊息轉成 Error 丟出
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `發生錯誤（HTTP ${res.status}）`;
    throw new Error(msg);
  }
  return data as T;
}
