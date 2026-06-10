// ============================================================
// 固定名單：把下面的假名單換成真實團員名字即可。
// - id：系統內部識別用，每人一個、不可重複；活動開始後不要再改
//   （照片與投票紀錄都掛在 id 上，改了會對不起來）
// - name：畫面上顯示的名字
// 改完 push 到 GitHub，Vercel 會自動重新部署。
// ============================================================

export type Member = { id: string; name: string };

export const MEMBERS: Member[] = [
  { id: "m01", name: "大Mike" },
  { id: "m02", name: "大刁" },
  { id: "m03", name: "酷斯拉" },
  { id: "m04", name: "小克" },
];

/** 每人最多上傳幾張照片 */
export const MAX_PHOTOS = 3;

/** 每人最多投幾票 */
export const MAX_VOTES = 3;

export function getMember(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
