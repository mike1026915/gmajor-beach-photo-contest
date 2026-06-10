// ============================================================
// 固定名單：把下面的假名單換成真實團員名字即可。
// - id：系統內部識別用，每人一個、不可重複；活動開始後不要再改
//   （照片與投票紀錄都掛在 id 上，改了會對不起來）
// - name：畫面上顯示的名字
// 改完 push 到 GitHub，Vercel 會自動重新部署。
// ============================================================

export type Member = { id: string; name: string };

export const MEMBERS: Member[] = [
  // T1
  { id: "m01", name: "T1 - 大Chris" },
  { id: "m02", name: "T1 - 小克" },
  { id: "m03", name: "T1 - 小魚" },
  { id: "m04", name: "T1 - 小翰" },
  { id: "m05", name: "T1 - 艾斯" },
  { id: "m06", name: "T1 - 兔子" },
  { id: "m07", name: "T1 - 湯尼" },
  { id: "m08", name: "T1 - 祺禮" },
  { id: "m09", name: "T1 - John" },
  { id: "m10", name: "T1 - Nick" },
  { id: "m11", name: "T1 - ZP" },
  { id: "m12", name: "T1 - Peter" },
  { id: "m13", name: "T1 - Sam" },
  { id: "m14", name: "T1 - Henry" },
  // T2
  { id: "m15", name: "T2 - 大威" },
  { id: "m16", name: "T2 - 小宗" },
  { id: "m17", name: "T2 - 小愛" },
  { id: "m18", name: "T2 - 小榮" },
  { id: "m19", name: "T2 - 小Mike" },
  { id: "m20", name: "T2 - 小Tony" },
  { id: "m21", name: "T2 - 老K" },
  { id: "m22", name: "T2 - 西風" },
  { id: "m23", name: "T2 - 典典" },
  { id: "m24", name: "T2 - 阿宗" },
  { id: "m25", name: "T2 - 阿崴" },
  { id: "m26", name: "T2 - 罐頭" },
  { id: "m27", name: "T2 - Derek" },
  { id: "m28", name: "T2 - Martin" },
  { id: "m29", name: "T2 - Masa" },
  { id: "m30", name: "T2 - Willie" },
  { id: "m31", name: "T2 - 阿昆" },
  { id: "m32", name: "T2 - Gary" },
  { id: "m33", name: "T2 - Daniel" },
  { id: "m34", name: "T2 - Shawn" },
  { id: "m35", name: "T2 - 祥雲" },
  // B1
  { id: "m36", name: "B1 - 八國" },
  { id: "m37", name: "B1 - 大刁" },
  { id: "m38", name: "B1 - 小虎" },
  { id: "m39", name: "B1 - 小馬" },
  { id: "m40", name: "B1 - 汪汪" },
  { id: "m41", name: "B1 - 阿弘" },
  { id: "m42", name: "B1 - 阿亨" },
  { id: "m43", name: "B1 - 航航" },
  { id: "m44", name: "B1 - 蜜汁熊" },
  { id: "m45", name: "B1 - Garry Hsu" },
  { id: "m46", name: "B1 - Mike" },
  { id: "m47", name: "B1 - Sean" },
  { id: "m48", name: "B1 - Titan" },
  { id: "m49", name: "B1 - 育全" },
  { id: "m50", name: "B1 - 元傲" },
  { id: "m51", name: "B1 - Roy" },
  { id: "m52", name: "B1 - Toshi" },
  // B2
  { id: "m53", name: "B2 - 小右" },
  { id: "m54", name: "B2 - 中克" },
  { id: "m55", name: "B2 - 阿全" },
  { id: "m56", name: "B2 - 阿得" },
  { id: "m57", name: "B2 - 浩浩" },
  { id: "m58", name: "B2 - 酷斯拉" },
  { id: "m59", name: "B2 - Allan" },
  { id: "m60", name: "B2 - David" },
  { id: "m61", name: "B2 - Stan" },
  { id: "m62", name: "B2 - Tylor Chiu" },
  { id: "m63", name: "B2 - Vec" },
  // Conductor
  { id: "m64", name: "Conductor - 阿信" },
  { id: "m65", name: "Conductor - Mario" },
];

/** 每人最多上傳幾張照片 */
export const MAX_PHOTOS = 3;

/** 每人最多投幾票 */
export const MAX_VOTES = 3;

export function getMember(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
