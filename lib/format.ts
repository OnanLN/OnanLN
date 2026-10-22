export function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

export function defaultNickname(phone: string) {
  return `旅人${phone.slice(-4)}`;
}

export function formatWhen(ts: number, now = Date.now()) {
  const diff = Math.max(0, now - ts);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  const date = new Date(ts);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

export function formatCoord(lat: number, lng: number) {
  const ns = lat >= 0 ? "北纬" : "南纬";
  const ew = lng >= 0 ? "东经" : "西经";
  return `${ns} ${Math.abs(lat).toFixed(2)}° · ${ew} ${Math.abs(lng).toFixed(2)}°`;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function shortPlace(name: string, max = 6) {
  return [...name].length > max ? [...name].slice(0, max).join("") : name;
}
