import type { Priority, Role } from "./types";

/** 優先度の表示メタ。 */
export const PRIORITY_META: Record<
  Priority,
  { label: string; className: string }
> = {
  high: {
    label: "高",
    className: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
  },
  medium: {
    label: "中",
    className: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
  low: {
    label: "低",
    className: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  },
};

/** 役職チップの色。 */
export const ROLE_CHIP: Record<Role, string> = {
  admin: "bg-slate-800 text-white",
  exec: "bg-indigo-100 text-indigo-700",
  manager: "bg-violet-100 text-violet-700",
  member: "bg-sky-100 text-sky-700",
  intern: "bg-emerald-100 text-emerald-700",
};

/**
 * 事業カテゴリの配色（colorKey で引く）。
 * bar=カテゴリ見出しの地色（白文字）／sub=サブ事業見出しの地色／tint=本文の淡い地色。
 */
export const CATEGORY_STYLE: Record<
  string,
  { bar: string; sub: string; tint: string; text: string }
> = {
  blue: { bar: "#3f83c4", sub: "#7aa9d8", tint: "#eef5fb", text: "#1e4b78" },
  purple: { bar: "#7c5bd1", sub: "#a58ae0", tint: "#f2edfb", text: "#4a3494" },
  orange: { bar: "#df8f2e", sub: "#eab364", tint: "#fdf2e3", text: "#8a5615" },
  green: { bar: "#4f9d5b", sub: "#84c08e", tint: "#eaf5ec", text: "#2f6b39" },
  slate: { bar: "#64748b", sub: "#94a3b8", tint: "#f1f5f9", text: "#334155" },
};

export const CATEGORY_STYLE_DEFAULT = CATEGORY_STYLE.slate;
