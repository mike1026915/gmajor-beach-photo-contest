import { NextRequest, NextResponse } from "next/server";
import { getMember, MAX_VOTES } from "@/lib/members";
import { getServiceClient, getSettings } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 查自己目前投了哪些照片（重投時預先勾選用）
export async function GET(request: NextRequest) {
  const voterId = request.nextUrl.searchParams.get("voter") ?? "";
  if (!getMember(voterId)) {
    return NextResponse.json({ error: "名單裡沒有這個人" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const [settings, { data: votes, error }] = await Promise.all([
    getSettings(supabase),
    supabase.from("votes").select("photo_id").eq("voter_member_id", voterId),
  ]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    votingOpen: settings.voting_open,
    photoIds: (votes ?? []).map((v) => v.photo_id as string),
  });
}

// 送出投票（換票語意：先清掉這個人全部舊票，再寫入新選擇）
export async function POST(request: NextRequest) {
  let body: { voterMemberId?: unknown; photoIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const voterId = String(body.voterMemberId ?? "");
  if (!getMember(voterId)) {
    return NextResponse.json({ error: "名單裡沒有這個人" }, { status: 400 });
  }
  if (
    !Array.isArray(body.photoIds) ||
    body.photoIds.some((id) => typeof id !== "string")
  ) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }
  const photoIds = [...new Set(body.photoIds as string[])];
  if (photoIds.length > MAX_VOTES) {
    return NextResponse.json(
      { error: `最多只能投 ${MAX_VOTES} 票` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const settings = await getSettings(supabase);
  if (!settings.voting_open) {
    return NextResponse.json({ error: "投票已截止" }, { status: 403 });
  }

  if (photoIds.length > 0) {
    const { data: photos, error } = await supabase
      .from("photos")
      .select("id, member_id")
      .in("id", photoIds);
    if (error) {
      return NextResponse.json(
        { error: "照片資料有誤，請重新整理後再試" },
        { status: 400 }
      );
    }
    if ((photos ?? []).length !== photoIds.length) {
      return NextResponse.json(
        { error: "有照片已被刪除，請重新整理後再選一次" },
        { status: 409 }
      );
    }
    if ((photos ?? []).some((p) => p.member_id === voterId)) {
      return NextResponse.json(
        { error: "不能投自己的照片" },
        { status: 400 }
      );
    }
  }

  const { error: clearError } = await supabase
    .from("votes")
    .delete()
    .eq("voter_member_id", voterId);
  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }

  if (photoIds.length > 0) {
    const { error: insertError } = await supabase
      .from("votes")
      .insert(photoIds.map((photoId) => ({
        voter_member_id: voterId,
        photo_id: photoId,
      })));
    if (insertError) {
      return NextResponse.json(
        { error: `投票寫入失敗，請再送出一次：${insertError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, photoIds });
}
