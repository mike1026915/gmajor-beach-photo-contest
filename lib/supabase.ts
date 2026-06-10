import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const PHOTOS_BUCKET = "photos";

function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function getServiceClient(): SupabaseClient {
  const rawUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !key) {
    throw new Error("缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數");
  }
  const url = normalizeSupabaseUrl(rawUrl);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function publicPhotoUrl(supabase: SupabaseClient, path: string): string {
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export type Settings = { uploads_open: boolean; voting_open: boolean };

export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("uploads_open, voting_open")
    .eq("id", 1)
    .single();
  if (error) throw new Error(`讀取 settings 失敗：${error.message}`);
  return data;
}
