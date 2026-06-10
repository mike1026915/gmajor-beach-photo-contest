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
  const photos = photosRes.data ?? [];
  const photoById = new Map(
    photos.map((p) => [p.id as string, p])
  );

  const countByPhoto = new Map<string, number>();
  const votersByPhoto = new Map<string, string[]>();
  const votedForByVoter = new Map<
    string,
    { voterName: string; choices: { memberName: string; slot: number }[] }
  >();

  for (const v of votes) {
    const photoId = v.photo_id as string;
    const voterId = v.voter_member_id as string;
    const voterName = getMember(voterId)?.name ?? voterId;

    countByPhoto.set(photoId, (countByPhoto.get(photoId) ?? 0) + 1);

    const photoVoters = votersByPhoto.get(photoId) ?? [];
    photoVoters.push(voterName);
    votersByPhoto.set(photoId, photoVoters);

    const photo = photoById.get(photoId);
    if (photo) {
      const entry = votedForByVoter.get(voterId) ?? {
        voterName,
        choices: [],
      };
      entry.choices.push({
        memberName: getMember(photo.member_id)?.name ?? photo.member_id,
        slot: photo.slot as number,
      });
      votedForByVoter.set(voterId, entry);
    }
  }

  for (const names of votersByPhoto.values()) {
    names.sort((a, b) => a.localeCompare(b, "zh-Hant"));
  }

  const voteLog = [...votedForByVoter.values()]
    .map((entry) => ({
      voterName: entry.voterName,
      votedFor: entry.choices.sort(
        (a, b) =>
          a.memberName.localeCompare(b.memberName, "zh-Hant") ||
          a.slot - b.slot
      ),
    }))
    .sort((a, b) => a.voterName.localeCompare(b.voterName, "zh-Hant"));

  const results = photos
    .map((p) => ({
      id: p.id as string,
      url: publicPhotoUrl(supabase, p.storage_path),
      memberName: getMember(p.member_id)?.name ?? p.member_id,
      slot: p.slot as number,
      votes: countByPhoto.get(p.id) ?? 0,
      voters: votersByPhoto.get(p.id) ?? [],
    }))
    .sort((a, b) => b.votes - a.votes || a.memberName.localeCompare(b.memberName));

  return NextResponse.json({
    uploadsOpen: settings.uploads_open,
    votingOpen: settings.voting_open,
    voterCount: new Set(votes.map((v) => v.voter_member_id)).size,
    voteLog,
    results,
  });
}
