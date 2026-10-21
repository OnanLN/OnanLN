export function formatYuan(cents: number | null | undefined): string {
  if (cents == null) return "待补充";
  if (cents === 0) return "免费";
  const yuan = cents / 100;
  const text = Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
  return `¥${text}`;
}

export function formatCents(cents: number): string {
  const yuan = cents / 100;
  const text = Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
  return `¥${text}`;
}
