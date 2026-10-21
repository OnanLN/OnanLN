export const VISITOR_LABEL: Record<string, string> = {
  yes: "外来车可进",
  no: "不接受外来车",
  permit: "外来车需登记",
  unknown: "外来政策待核实",
};

export const LOT_TYPE_LABEL: Record<string, string> = {
  underground: "地下",
  ground: "地面",
  roadside: "路边",
  stereo: "立体",
  mechanical: "机械",
};

export const MODE_LABEL: Record<string, string> = {
  hour: "按小时",
  day: "白天档",
  night: "夜间档",
  month: "按月",
  year: "按年",
  holiday: "节假日整段",
};

export const SOURCE_LABEL: Record<string, string> = {
  manual: "后台收录",
  user: "用户上报",
  amap: "高德地图",
  baidu: "百度地图",
  tencent: "腾讯地图",
  partner: "车场接入",
};

export const MODES = ["hour", "day", "night", "month", "year", "holiday"] as const;
export type ListingMode = (typeof MODES)[number];

export function isMode(value: string): value is ListingMode {
  return (MODES as readonly string[]).includes(value);
}
