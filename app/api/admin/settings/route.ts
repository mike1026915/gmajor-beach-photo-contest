import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 管理者專用：切換「開放上傳」「開放投票」
export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
  }

  let body: { uploadsOpen?: unknown; votingOpen?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const update: { uploads_open?: boolean; voting_open?: boolean } = {};
  if (typeof body.uploadsOpen === "boolean") update.uploads_open = body.uploadsOpen;
  if (typeof body.votingOpen === "boolean") update.voting_open = body.votingOpen;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "沒有要更新的欄位" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("settings")
    .update(update)
    .eq("id", 1)
    .select("uploads_open, voting_open")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    uploadsOpen: data.uploads_open,
    votingOpen: data.voting_open,
  });
}
