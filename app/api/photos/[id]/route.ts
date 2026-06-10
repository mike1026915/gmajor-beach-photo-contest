import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient, getSettings, PHOTOS_BUCKET } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 刪除照片（票經 FK CASCADE 一併刪除，Storage 檔案同步移除）。
// 本人帶 ?member=<id> 可刪自己的照片（限上傳開放期間）；管理者帶密碼 header 可刪任何照片。
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: photo, error } = await supabase
    .from("photos")
    .select("id, member_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: "照片不存在" }, { status: 404 });
  }

  const admin = isAdminRequest(request);
  if (!admin) {
    const memberId = request.nextUrl.searchParams.get("member");
    if (photo.member_id !== memberId) {
      return NextResponse.json({ error: "只能刪除自己的照片" }, { status: 403 });
    }
    const settings = await getSettings(supabase);
    if (!settings.uploads_open) {
      return NextResponse.json({ error: "上傳已截止，無法刪除" }, { status: 403 });
    }
  }

  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path]);

  return NextResponse.json({ ok: true });
}
