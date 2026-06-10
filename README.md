# 合唱團海灘攝影比賽 📸

合唱團出遊活動用的照片上傳＋匿名投票網站。

- 前端：Next.js（部署到 Vercel 免費額度）
- 後端：Supabase 免費額度（Postgres 存資料、Storage 存照片）

## 活動規則

- 從固定名單選自己的名字上傳，每人最多 3 張；滿了由自己選要替換／刪除哪張
- 每人 3 票投給照片，同一張只能投一票，不能投自己的照片
- 可以重投（整組重選換票）
- 投票牆匿名展示（看不到照片是誰拍的），一般使用者看不到票數
- 管理頁（`/admin`，密碼保護）：看票數排行、刪任何照片、切換「開放上傳／開放投票」

## 設定步驟

### A. 建立 Supabase 專案

1. 到 [supabase.com](https://supabase.com) 用 GitHub 帳號註冊／登入
2. **New Project**：名稱隨意、Database password 用自動產生的即可、Region 選 **Northeast Asia (Tokyo)**，建立後等 1–2 分鐘

### B. 建資料表

3. 左側 **SQL Editor** → New query → 貼上 [supabase/schema.sql](supabase/schema.sql) 的全部內容 → **Run**

### C. 建照片儲存空間

4. 左側 **Storage** → **New bucket**：
   - Name：`photos`（必須一字不差）
   - 勾選 **Public bucket**
   - 其他不用動，Save（不需要設定任何 Storage policy）

### D. 取得金鑰

5. **Project Settings**（齒輪）→ **API**：
   - **Project URL** → 填到 `SUPABASE_URL`（只填 `https://xxxx.supabase.co`，不要加 `/rest/v1`）
   - **service_role** key（新版介面叫 Secret key，`sb_secret_` 開頭）→ 填到 `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ 這把 key 有完整讀寫權限，只能放環境變數，絕不能 commit 進 git 或放到前端

### E. 本機試跑

```bash
cp .env.example .env.local   # 填入上面兩個值 + 自訂 ADMIN_PASSWORD
npm install
npm run dev                  # http://localhost:3000
```

### F. 部署到 Vercel

6. repo push 到 GitHub（private 即可）
7. [vercel.com](https://vercel.com) 用 GitHub 登入 → **Add New → Project** → Import 這個 repo
8. Framework 自動偵測 Next.js，build 設定不用改；**Environment Variables** 填入與 `.env.local` 相同的三個變數
9. **Deploy** → 把 `https://xxx.vercel.app` 網址發給團員

## 日常維護

- **換名單／活動名稱**：編輯 [lib/members.ts](lib/members.ts)，push 後 Vercel 自動重新部署
- ⚠️ Supabase 免費專案**閒置約一週會自動暫停**：活動前到 dashboard 確認專案是 Active，被暫停就按 Restore（資料不會掉）
- 活動結束想保留結果：管理頁看完票數即可，或到 Supabase Table Editor 匯出 CSV
