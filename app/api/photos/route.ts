import { NextRequest, NextResponse } from "next/server";
import { getMember, MAX_PHOTOS } from "@/lib/members";
import {
  getServiceClient,
  getSettings,
  publicPhotoUrl,
  PHOTOS_BUCKET,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 投票牆清單：只回傳照片 id 與圖片網址，不含上傳者。
// 帶 ?member=<id> 時額外標記哪些是自己的照片（供前端禁止投自己）。
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const memberId = request.nextUrl.searchParams.get("member");

  const [settings, { data: photos, error }] = await Promise.all([
    getSettings(supabase),
    supabase.from("photos").select("id, member_id, storage_path"),
  ]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (photos ?? []).map((p) => ({
    id: p.id as string,
    url: publicPhotoUrl(supabase, p.storage_path),
    mine: memberId !== null && p.member_id === memberId,
  }));

  // 洗牌，避免同一人的照片排在一起而洩漏是誰拍的
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  return NextResponse.json({
    uploadsOpen: settings.uploads_open,
    votingOpen: settings.voting_open,
    photos: list,
  });
}

// 上傳照片到指定 slot（1–3）。該 slot 已有照片時視為替換：
// 舊照片連同它的票一起作廢（FK CASCADE），Storage 舊檔同步刪除。
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();

  const settings = await getSettings(supabase);
  if (!settings.uploads_open) {
    return NextResponse.json({ error: "上傳已截止" }, { status: 403 });
  }

  const form = await request.formData();
  const memberId = String(form.get("memberId") ?? "");
  const slot = Number(form.get("slot"));
  const file = form.get("file");

  if (!getMember(memberId)) {
    return NextResponse.json({ error: "名單裡沒有這個人" }, { status: 400 });
  }
  if (!Number.isInteger(slot) || slot < 1 || slot > MAX_PHOTOS) {
    return NextResponse.json({ error: "slot 不正確" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "沒有收到照片" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "只能上傳圖片檔" }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "照片壓縮後仍太大，請換一張試試" },
      { status: 413 }
    );
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) {
    return NextResponse.json(
      { error: `照片上傳失敗：${uploadError.message}` },
      { status: 500 }
    );
  }

  const cleanupUploaded = () =>
    supabase.storage.from(PHOTOS_BUCKET).remove([path]);

  const { data: old, error: oldError } = await supabase
    .from("photos")
    .select("id, storage_path")
    .eq("member_id", memberId)
    .eq("slot", slot)
    .maybeSingle();
  if (oldError) {
    await cleanupUploaded();
    return NextResponse.json({ error: oldError.message }, { status: 500 });
  }

  if (old) {
    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", old.id);
    if (deleteError) {
      await cleanupUploaded();
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("photos")
    .insert({ member_id: memberId, slot, storage_path: path })
    .select("id")
    .single();
  if (insertError) {
    await cleanupUploaded();
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (old) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([old.storage_path]);
  }

  return NextResponse.json({
    id: inserted.id,
    slot,
    url: publicPhotoUrl(supabase, path),
  });
}
