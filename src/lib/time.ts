export const SH_OFFSET_MS = 8 * 60 * 60 * 1000;

export type Ymd = { y: number; m: number; d: number };

export function shParts(date: Date): Ymd & { hh: number; mm: number } {
  const sh = new Date(date.getTime() + SH_OFFSET_MS);
  return {
    y: sh.getUTCFullYear(),
    m: sh.getUTCMonth(),
    d: sh.getUTCDate(),
    hh: sh.getUTCHours(),
    mm: sh.getUTCMinutes(),
  };
}

export function fromSh(y: number, m: number, d: number, hh = 0, mm = 0): Date {
  return new Date(Date.UTC(y, m, d, hh, mm) - SH_OFFSET_MS);
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatYmd(parts: Ymd): string {
  return `${parts.y}-${pad(parts.m + 1)}-${pad(parts.d)}`;
}

export function formatSh(date: Date, withTime = true): string {
  const parts = shParts(date);
  const day = formatYmd(parts);
  if (!withTime) return day;
  return `${day} ${pad(parts.hh)}:${pad(parts.mm)}`;
}

export function parseYmd(input: string | undefined | null): Ymd | null {
  if (!input) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m || probe.getUTCDate() !== d) return null;
  return { y, m, d };
}

export function parseShDateTime(input: string | undefined | null): Date | null {
  if (!input) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const ymd = parseYmd(`${match[1]}-${match[2]}-${match[3]}`);
  if (!ymd) return null;
  const hh = Number(match[4]);
  const mm = Number(match[5]);
  if (hh > 23 || mm > 59) return null;
  return fromSh(ymd.y, ymd.m, ymd.d, hh, mm);
}

export function addDays(y: number, m: number, d: number, days: number): Ymd {
  const next = new Date(Date.UTC(y, m, d + days));
  return { y: next.getUTCFullYear(), m: next.getUTCMonth(), d: next.getUTCDate() };
}

export function addMonths(y: number, m: number, d: number, months: number): Ymd {
  const total = m + months;
  const yy = y + Math.floor(total / 12);
  const mm = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
  return { y: yy, m: mm, d: Math.min(d, last) };
}

export function floorToHour(date: Date): Date {
  const parts = shParts(date);
  return fromSh(parts.y, parts.m, parts.d, parts.hh, 0);
}

export function todayYmd(now = new Date()): string {
  return formatYmd(shParts(now));
}

export function tomorrowYmd(now = new Date()): string {
  const parts = shParts(now);
  return formatYmd(addDays(parts.y, parts.m, parts.d, 1));
}
