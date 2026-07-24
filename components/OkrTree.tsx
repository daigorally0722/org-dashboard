"use client";

import { useState } from "react";
import { ChevronRight, Target, User as UserIcon } from "lucide-react";
import type {
  BoardView,
  BusinessView,
  CategoryView,
  IndividualView,
  UserRow,
} from "@/lib/types";
import { CATEGORY_STYLE, CATEGORY_STYLE_DEFAULT } from "@/lib/layers";
import TaskAreaGroups from "./TaskAreaGroups";
import { cn } from "@/lib/cn";

// ============================================================================
// OkrTree（リスト表示）— 会社 → 事業カテゴリ → 事業(サブ) → 個人 → タスク の
// 縦アコーディオン。カテゴリごとに色分け。個人を開くとタスクが出る。
// ============================================================================

interface Helpers {
  currentUser: UserRow;
  canAudit: boolean;
  getDone: (id: string) => boolean;
  getCompletedByName: (id: string) => string | null;
  onToggle: (id: string) => void;
}

function Progress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <span className="block h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs font-medium tabular-nums text-slate-500">
        {done}/{total}
      </span>
    </span>
  );
}

function KeyResults({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((kr, i) => (
        <li key={i} className="flex gap-2 text-xs text-slate-600">
          <span className="font-mono text-slate-400">KR{i + 1}</span>
          <span>{kr}</span>
        </li>
      ))}
    </ul>
  );
}

// ── 個人ノード ──────────────────────────────────────────────
function IndividualNode({ ind, h }: { ind: IndividualView; h: Helpers }) {
  const [open, setOpen] = useState(ind.isSelf);
  const done = ind.tasks.filter((t) => h.getDone(t.id)).length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white",
        ind.isSelf ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-90")} />
        <UserIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-900">{ind.name}</span>
            {ind.isSelf && (
              <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                あなた
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">🎯 {ind.objective}</span>
        </span>
        <Progress done={done} total={ind.tasks.length} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-3.5 py-3">
          {ind.keyResults.length > 0 && (
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <KeyResults items={ind.keyResults} />
            </div>
          )}
          <TaskAreaGroups
            areaGroups={ind.areaGroups}
            tasks={ind.tasks}
            getDone={h.getDone}
            getCompletedByName={h.getCompletedByName}
            canAudit={h.canAudit}
            onToggle={h.onToggle}
          />
        </div>
      )}
    </div>
  );
}

// ── サブ事業ノード ──────────────────────────────────────────
function BusinessNode({ sub, accent, h }: { sub: BusinessView; accent: string; h: Helpers }) {
  const [open, setOpen] = useState(true);
  const allTasks = sub.individuals.flatMap((i) => i.tasks);
  const done = allTasks.filter((t) => h.getDone(t.id)).length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-90")} />
        <span className="text-lg">{sub.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{sub.name}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              事業
            </span>
            {sub.isOwn && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                自分の事業
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">🎯 {sub.objective}</span>
        </span>
        <Progress done={done} total={allTasks.length} />
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-3 py-3">
          {sub.keyResults.length > 0 && (
            <div className="rounded-lg bg-white px-3 py-2">
              <KeyResults items={sub.keyResults} />
            </div>
          )}
          {sub.individuals.length === 0 ? (
            <p className="px-1 text-xs text-slate-400">表示できるメンバーはいません</p>
          ) : (
            sub.individuals.map((ind) => <IndividualNode key={ind.id} ind={ind} h={h} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── 事業カテゴリノード ──────────────────────────────────────
function CategoryNode({ cat, h }: { cat: CategoryView; h: Helpers }) {
  const [open, setOpen] = useState(cat.isOwnBranch || h.currentUser.role === "admin" || h.currentUser.role === "exec");
  const style = CATEGORY_STYLE[cat.colorKey] ?? CATEGORY_STYLE_DEFAULT;
  const allTasks = [
    ...cat.subs.flatMap((s) => s.individuals.flatMap((i) => i.tasks)),
    ...cat.individuals.flatMap((i) => i.tasks),
  ];
  const done = allTasks.filter((t) => h.getDone(t.id)).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1.5" style={{ backgroundColor: style.bar }} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <ChevronRight className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform", open && "rotate-90")} />
        <span className="text-2xl">{cat.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">{cat.name}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: style.bar }}
            >
              事業カテゴリ
            </span>
            {cat.isOwnBranch && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                自分の事業
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">🎯 {cat.objective}</span>
        </span>
        <Progress done={done} total={allTasks.length} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-4" style={{ backgroundColor: style.tint }}>
          {cat.keyResults.length > 0 && (
            <div className="rounded-xl bg-white px-4 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Target className="h-3.5 w-3.5" />
                事業カテゴリOKR
              </div>
              <KeyResults items={cat.keyResults} />
            </div>
          )}
          {cat.subs.length === 0 && cat.individuals.length === 0 ? (
            <p className="px-1 text-xs text-slate-500">この事業はまだOKRのみです（担当・タスク未設定）。</p>
          ) : (
            <div className="space-y-2">
              {cat.subs.map((sub) => (
                <BusinessNode key={sub.id} sub={sub} accent={style.sub} h={h} />
              ))}
              {cat.individuals.map((ind) => (
                <IndividualNode key={ind.id} ind={ind} h={h} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 会社バナー ＋ カテゴリ一覧 ──────────────────────────────
export default function OkrTree({ board, helpers }: { board: BoardView; helpers: Helpers }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-7">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-white/80">
            会社OKR
          </span>
          <span className="text-xs font-medium text-white/50">{board.companyOkr.quarter}</span>
        </div>
        <h1 className="text-lg font-bold leading-snug sm:text-xl">{board.companyOkr.objective}</h1>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {board.companyOkr.key_results.map((kr, i) => (
            <li key={i} className="rounded-xl bg-white/5 p-3 text-sm leading-snug text-white/90 ring-1 ring-inset ring-white/10">
              <span className="mb-1 block font-mono text-xs text-white/40">KR{i + 1}</span>
              {kr}
            </li>
          ))}
        </ul>
      </div>

      {board.categories.map((cat) => (
        <CategoryNode key={cat.id} cat={cat} h={helpers} />
      ))}
    </div>
  );
}
