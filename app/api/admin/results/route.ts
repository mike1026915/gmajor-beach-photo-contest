import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getMember } from "@/lib/members";
import { getServiceClient, getSettings, publicPhotoUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 管理者專用：每張照片的上傳者與票數（依票數排序）＋活動開關現況
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const [settings, photosRes, votesRes] = await Promise.all([
    getSettings(supabase),
    supabase
      .from("photos")
      .select("id, member_id, slot, storage_path, created_at"),
    supabase.from("votes").select("photo_id, voter_member_id"),
  ]);
  if (photosRes.error) {
    return NextResponse.json({ error: photosRes.error.message }, { status: 500 });
  }
  if (votesRes.error) {
    return NextResponse.json({ error: votesRes.error.message }, { status: 500 });
  }

  const votes = votesRes.data ?? [];
  const countByPhoto = new Map<string, number>();
  for (const v of votes) {
    countByPhoto.set(v.photo_id, (countByPhoto.get(v.photo_id) ?? 0) + 1);
  }

  const results = (photosRes.data ?? [])
    .map((p) => ({
      id: p.id as string,
      url: publicPhotoUrl(supabase, p.storage_path),
      memberName: getMember(p.member_id)?.name ?? p.member_id,
      slot: p.slot as number,
      votes: countByPhoto.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes || a.memberName.localeCompare(b.memberName));

  return NextResponse.json({
    uploadsOpen: settings.uploads_open,
    votingOpen: settings.voting_open,
    voterCount: new Set(votes.map((v) => v.voter_member_id)).size,
    results,
  });
}
