export const POINT_CENTS = 10;
export const FEE_RATE = 0.08;
export const WELCOME_POINTS = 200;
export const REPORT_POINTS = 80;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const SESSION_DAYS = 14;
export const MAX_CODES_PER_HOUR = 5;

export const CITIES = ["上海", "杭州", "北京", "深圳"] as const;

export function pointsToYuan(points: number): number {
  return (points * POINT_CENTS) / 100;
}
