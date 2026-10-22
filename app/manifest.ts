import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "途记",
    short_name: "途记",
    description: "把旅行攻略钉在同一张地图上",
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee4",
    theme_color: "#f3eee4",
    lang: "zh-CN",
  };
}
