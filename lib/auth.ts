import { cookies } from "next/headers";
import { getUserByToken } from "./session";

export const SESSION_COOKIE = "tuji_session";

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserByToken(token);
}

export async function readSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}
