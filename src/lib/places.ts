export type Place = {
  name: string;
  city: string;
  lat: number;
  lng: number;
  aliases: string[];
};

export const CITY_CENTERS: Record<string, { lat: number; lng: number; label: string }> = {
  上海: { lat: 31.2304, lng: 121.4737, label: "上海 · 人民广场" },
  杭州: { lat: 30.2486, lng: 120.148, label: "杭州 · 西湖" },
  北京: { lat: 39.9087, lng: 116.3975, label: "北京 · 天安门" },
  深圳: { lat: 22.5431, lng: 114.0579, label: "深圳 · 市民中心" },
};

export const PLACES: Place[] = [
  { name: "人民广场", city: "上海", lat: 31.2304, lng: 121.4737, aliases: ["人民广场", "南京东路", "上海中心城区"] },
  { name: "陆家嘴", city: "上海", lat: 31.2397, lng: 121.4998, aliases: ["陆家嘴", "东方明珠", "上海中心", "金茂"] },
  { name: "静安寺", city: "上海", lat: 31.2234, lng: 121.4455, aliases: ["静安寺", "静安嘉里", "南京西路"] },
  { name: "徐家汇", city: "上海", lat: 31.1886, lng: 121.4368, aliases: ["徐家汇", "美罗城"] },
  { name: "上海火车站", city: "上海", lat: 31.2496, lng: 121.4554, aliases: ["上海火车站", "火车站", "天目路"] },
  { name: "虹桥枢纽", city: "上海", lat: 31.194, lng: 121.3209, aliases: ["虹桥", "虹桥火车站", "虹桥机场", "虹桥天地"] },
  { name: "五角场", city: "上海", lat: 31.2998, lng: 121.5145, aliases: ["五角场", "万达"] },
  { name: "世纪公园", city: "上海", lat: 31.2146, lng: 121.5507, aliases: ["世纪公园", "花木"] },
  { name: "武康路", city: "上海", lat: 31.2132, lng: 121.4382, aliases: ["武康路", "衡复", "安福路"] },
  { name: "前滩", city: "上海", lat: 31.1548, lng: 121.4806, aliases: ["前滩", "太古里", "前滩太古里"] },
  { name: "张江", city: "上海", lat: 31.2034, lng: 121.6004, aliases: ["张江", "张江高科", "科学城"] },
  { name: "外滩", city: "上海", lat: 31.2402, lng: 121.4906, aliases: ["外滩", "外滩源", "中山东路"] },
  { name: "中山公园", city: "上海", lat: 31.2216, lng: 121.4159, aliases: ["中山公园", "龙之梦"] },
  { name: "七宝", city: "上海", lat: 31.1584, lng: 121.3496, aliases: ["七宝", "七宝老街"] },
  { name: "新天地", city: "上海", lat: 31.2198, lng: 121.475, aliases: ["新天地", "淮海中路"] },
  { name: "迪士尼", city: "上海", lat: 31.1433, lng: 121.658, aliases: ["迪士尼", "上海迪士尼"] },
  { name: "西湖", city: "杭州", lat: 30.2486, lng: 120.148, aliases: ["西湖", "断桥", "湖滨"] },
  { name: "武林广场", city: "杭州", lat: 30.275, lng: 120.1635, aliases: ["武林广场", "武林", "杭州大厦"] },
  { name: "钱江新城", city: "杭州", lat: 30.246, lng: 120.2105, aliases: ["钱江新城", "市民中心", "来福士"] },
  { name: "火车东站", city: "杭州", lat: 30.2908, lng: 120.2127, aliases: ["火车东站", "杭州东站"] },
  { name: "国贸", city: "北京", lat: 39.9088, lng: 116.459, aliases: ["国贸", "cbd", "建外"] },
  { name: "三里屯", city: "北京", lat: 39.9372, lng: 116.4551, aliases: ["三里屯", "太古里"] },
  { name: "中关村", city: "北京", lat: 39.9836, lng: 116.3164, aliases: ["中关村", "五道口"] },
  { name: "王府井", city: "北京", lat: 39.9148, lng: 116.4109, aliases: ["王府井"] },
  { name: "西单", city: "北京", lat: 39.9125, lng: 116.3742, aliases: ["西单"] },
  { name: "福田中心", city: "深圳", lat: 22.5333, lng: 114.0545, aliases: ["福田", "市民中心", "会展中心"] },
  { name: "海岸城", city: "深圳", lat: 22.518, lng: 113.936, aliases: ["海岸城", "南山区", "后海"] },
  { name: "科技园", city: "深圳", lat: 22.5405, lng: 113.951, aliases: ["科技园", "深大", "粤海街道"] },
  { name: "罗湖口岸", city: "深圳", lat: 22.5324, lng: 114.1168, aliases: ["罗湖", "口岸", "东门"] },
];

export function matchPlace(query: string, city?: string): Place | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const pool = city ? [...PLACES.filter((item) => item.city === city), ...PLACES.filter((item) => item.city !== city)] : PLACES;
  let best: { place: Place; score: number } | null = null;
  for (const place of pool) {
    for (const alias of place.aliases) {
      const text = alias.toLowerCase();
      let score = 0;
      if (text === q) score = 100;
      else if (q.includes(text) || text.includes(q)) score = 60 + Math.min(text.length, 20);
      if (city && place.city === city) score += 5;
      if (score > 0 && (!best || score > best.score)) best = { place, score };
    }
  }
  return best && best.score >= 60 ? best.place : null;
}

export function suggestPlaces(query: string, city?: string, limit = 6): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return PLACES.filter((item) => !city || item.city === city).slice(0, limit);
  return PLACES.filter((place) => {
    if (city && place.city !== city && !place.aliases.some((alias) => alias.toLowerCase().includes(q))) return false;
    return place.aliases.some((alias) => alias.toLowerCase().includes(q) || q.includes(alias.toLowerCase()));
  }).slice(0, limit);
}
