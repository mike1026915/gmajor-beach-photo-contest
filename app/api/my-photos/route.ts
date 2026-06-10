import { NextRequest, NextResponse } from "next/server";
import { getMember } from "@/lib/members";
import { getServiceClient, getSettings, publicPhotoUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 自己的照片現況（上傳頁用）：回傳已佔用的 slot 與圖片網址
export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member") ?? "";
  if (!getMember(memberId)) {
    return NextResponse.json({ error: "名單裡沒有這個人" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const [settings, { data: photos, error }] = await Promise.all([
    getSettings(supabase),
    supabase
      .from("photos")
      .select("id, slot, storage_path")
      .eq("member_id", memberId)
      .order("slot"),
  ]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    uploadsOpen: settings.uploads_open,
    photos: (photos ?? []).map((p) => ({
      id: p.id as string,
      slot: p.slot as number,
      url: publicPhotoUrl(supabase, p.storage_path),
    })),
  });
}
