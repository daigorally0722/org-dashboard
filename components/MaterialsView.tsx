"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Globe,
  StickyNote,
  File as FileIcon,
  ExternalLink,
  Search,
  FolderGit2,
  HardDrive,
  BookText,
  Link2,
} from "lucide-react";
import type { MaterialRow, ExternalLinkRow } from "@/lib/types";
import { generatedMaterials, materialsGeneratedAt } from "@/lib/materials.generated";
import { externalLinks } from "@/lib/links";
import { cn } from "@/lib/cn";

// ============================================================================
// MaterialsView（資料タブ）
//  ・作業効率フォルダの資料をビルド時に自動スキャンした一覧（インデックス）
//  ・Drive / Notion / GitHub など外部ツールへのリンク集
// ※ 静的サイトのためローカルファイルは直接開けない（カタログ＋外部リンクで運用）。
// ============================================================================

function iconFor(ext: string) {
  switch (ext) {
    case "pdf":
    case "docx":
    case "doc":
      return FileText;
    case "xlsx":
    case "xls":
      return FileSpreadsheet;
    case "pptx":
    case "ppt":
      return Presentation;
    case "html":
    case "htm":
      return Globe;
    case "md":
      return StickyNote;
    default:
      return FileIcon;
  }
}

const CATEGORY_ORDER = ["教材", "スライド", "データ", "Web資料", "ドキュメント", "メモ"];

const TOOL_META: Record<
  ExternalLinkRow["tool"],
  { label: string; icon: typeof HardDrive; className: string }
> = {
  drive: { label: "Drive", icon: HardDrive, className: "bg-amber-100 text-amber-700" },
  notion: { label: "Notion", icon: BookText, className: "bg-slate-200 text-slate-700" },
  github: { label: "GitHub", icon: FolderGit2, className: "bg-slate-900 text-white" },
  sheet: { label: "Sheet", icon: FileSpreadsheet, className: "bg-emerald-100 text-emerald-700" },
  other: { label: "リンク", icon: Link2, className: "bg-sky-100 text-sky-700" },
};

export default function MaterialsView() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("__all");

  const categories = useMemo(() => {
    const set = new Set(generatedMaterials.map((m) => m.category));
    return CATEGORY_ORDER.filter((c) => set.has(c));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return generatedMaterials.filter((m) => {
      if (activeCat !== "__all" && m.category !== activeCat) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, activeCat]);

  const grouped = useMemo(() => {
    const map = new Map<string, MaterialRow[]>();
    for (const m of filtered) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category)!.push(m);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* 外部ツール・リンク */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900">外部ツール・リンク</h2>
          <span className="text-xs text-slate-400">Drive / Notion / GitHub</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {externalLinks.map((link) => {
            const meta = TOOL_META[link.tool];
            const Icon = meta.icon;
            const hasUrl = Boolean(link.url);
            const inner = (
              <div
                className={cn(
                  "flex h-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                  hasUrl
                    ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    : "border-dashed border-slate-200 bg-slate-50",
                )}
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", meta.className)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{link.name}</span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {hasUrl ? link.url : link.note ?? "URL未設定"}
                  </span>
                </span>
                {hasUrl && <ExternalLink className="h-4 w-4 shrink-0 text-slate-300" />}
              </div>
            );
            return hasUrl ? (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <div key={link.id} title="URL未設定">
                {inner}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          ※ 実際のDriveの中身を自動取得するライブ連携は認証（OAuth）が必要です。まずはリンクで各ツールへ移動できます。
        </p>
      </section>

      {/* 作業効率フォルダの資料（自動生成インデックス） */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">作業効率フォルダの資料</h2>
            <p className="text-[11px] text-slate-400">
              自動スキャン {generatedMaterials.length} 件 ・ 生成日 {materialsGeneratedAt}
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="資料を検索"
              className="w-48 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <FilterChip label="すべて" active={activeCat === "__all"} onClick={() => setActiveCat("__all")} />
          {categories.map((c) => (
            <FilterChip key={c} label={c} active={activeCat === c} onClick={() => setActiveCat(c)} />
          ))}
        </div>

        {grouped.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
            該当する資料がありません
          </p>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ category, items }) => (
              <div key={category}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500">{category}</h3>
                  <span className="text-[10px] text-slate-400">{items.length}</span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {items.map((m) => (
                    <MaterialCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
          ※ これはMac上の資料のカタログ（インデックス）です。公開サイトからは直接開けないため、各資料に Drive 等のURLを付けると開けるようになります。
          機微なファイル（営業リスト・給与・クライアント名フォルダ）は公開安全のため自動で除外しています。
        </p>
      </section>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
      )}
    >
      {label}
    </button>
  );
}

function MaterialCard({ m }: { m: MaterialRow }) {
  const Icon = iconFor(m.ext);
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        m.url ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50" : "border-slate-200 bg-white",
      )}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-slate-800">{m.name}</span>
        <span className="block text-[11px] text-slate-400">
          {m.ext.toUpperCase()} ・ {m.size} ・ {m.updated}
        </span>
      </span>
      {m.url ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-slate-300" />
      ) : (
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
          ローカル
        </span>
      )}
    </div>
  );
  return m.url ? (
    <a href={m.url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}
