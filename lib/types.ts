import type { CoverTheme } from "./themes";

export type Guide = {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  destination: string;
  region: string;
  summary: string;
  content: string;
  lat: number;
  lng: number;
  coverTheme: CoverTheme;
  tags: string[];
  days: number;
  season: string;
  budget: string;
  createdAt: number;
  updatedAt: number;
  commentCount: number;
};

export type PublicUser = {
  id: number;
  nickname: string;
  bio: string;
  phoneMask: string;
  createdAt: number;
};

export type Presence = {
  userId: number;
  nickname: string;
  lat: number;
  lng: number;
  label: string;
  precision: "exact" | "fuzzy";
  updatedAt: number;
};

export type ActionFailure = {
  ok: false;
  error: string;
  status: number;
  retryAfter?: number;
};
