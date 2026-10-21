import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, KEY_LEN)) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const key = (await scrypt(password, salt, KEY_LEN)) as Buffer;
  const previous = Buffer.from(hex, "hex");
  if (previous.length !== key.length) return false;
  return timingSafeEqual(previous, key);
}

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8 || password.length > 64) {
    return "密码需要 8 到 64 位";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "密码需要同时包含字母和数字";
  }
  return null;
}
