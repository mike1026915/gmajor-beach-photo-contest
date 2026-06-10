import { timingSafeEqual } from "node:crypto";

export const ADMIN_PASSWORD_HEADER = "x-admin-password";

export function isAdminRequest(request: Request): boolean {
  const given = request.headers.get(ADMIN_PASSWORD_HEADER) ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
