import { z } from "zod";
import { THEMES } from "./themes";

export const phoneSchema = z
  .string({ required_error: "请填写手机号", invalid_type_error: "请填写手机号" })
  .trim()
  .regex(/^1[3-9]\d{9}$/, "请输入 11 位中国大陆手机号");

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, "给自己取一个称呼")
  .max(16, "称呼最多 16 个字")
  .regex(/^[\u4e00-\u9fa5A-Za-z0-9·.\-\s]+$/, "称呼里请使用中文、字母或数字");

export const verifySchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, "请输入 6 位验证码"),
  nickname: z.string().trim().max(16).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  nickname: nicknameSchema,
  bio: z.string().trim().max(80, "简介最多 80 个字"),
});

export const guideInputSchema = z.object({
  title: z.string().trim().min(4, "标题至少 4 个字").max(40, "标题最多 40 个字"),
  destination: z.string().trim().min(2, "填写目的地").max(20, "目的地名称太长"),
  region: z.string().trim().min(1, "填写地区").max(12, "地区名称太长"),
  summary: z.string().trim().min(10, "摘要至少 10 个字").max(140, "摘要最多 140 个字"),
  content: z.string().trim().min(40, "正文再写具体一点，至少 40 个字").max(8000, "正文最多 8000 字"),
  lat: z.number({ invalid_type_error: "请在地图上标出位置" }).min(-90, "纬度不正确").max(90, "纬度不正确"),
  lng: z.number({ invalid_type_error: "请在地图上标出位置" }).min(-180, "经度不正确").max(180, "经度不正确"),
  coverTheme: z.enum(THEMES),
  tags: z.array(z.string().trim().min(1).max(8, "单个标签最多 8 个字")).max(5, "最多 5 个标签"),
  days: z.number({ invalid_type_error: "填写天数" }).int("天数要是整数").min(1, "天数至少 1").max(60, "天数最多 60"),
  season: z.string().trim().min(1, "填写适合的季节").max(16, "季节说明太长"),
  budget: z.string().trim().min(1, "填写大概花费").max(24, "花费说明太长"),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "写点什么再发送").max(500, "留言最多 500 字"),
  parentId: z.number().int().positive().nullable().optional(),
});

export const locationSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false) }),
  z.object({
    enabled: z.literal(true),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().trim().max(24, "位置说明最多 24 个字").optional().default(""),
    precision: z.enum(["exact", "fuzzy"]).optional().default("fuzzy"),
  }),
]);

export type GuideInput = z.infer<typeof guideInputSchema>;

export function parseTags(raw: string) {
  const tags = raw
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)].slice(0, 5);
}

export function zodMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "填写的内容还需要改一改";
}
