"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { User as UserIcon, ListChecks, ChevronRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { BoardView, BusinessView, CategoryView, DepartmentView, IndividualView, UserRow } from "@/lib/types";
import { CATEGORY_STYLE, CATEGORY_STYLE_DEFAULT } from "@/lib/layers";
import TaskRow from "./TaskRow";
import { cn } from "@/lib/cn";

// ============================================================================
// OKRカスケード（横型ツリー）：会社 → 事業カテゴリ → 事業(サブ) →〔部署〕→ 個人 → タスク。
// 部署は規模の大きい事業（スキルゲット）だけに現れる“1列多い”階層。
// カテゴリ／事業／部署ノードはクリックで折りたたみ・展開できる。
// 個人ノードをクリックすると、その人の「やること」がツリーの下に出る。
// ============================================================================

interface Helpers {
  currentUser: UserRow;
  canAudit: boolean;
  getDone: (id: string) => boolean;
  getCompletedByName: (id: string) => string | null;
  onToggle: (id: string) => void;
}

const COMPANY_STYLE = { bar: "#334155", sub: "#64748b", tint: "#f1f5f9", text: "#334155" };
const INDIV_STYLE = { bar: "#64748b", tint: "#f8fafc", text: "#334155" };

function KRList({ items, color }: { items: string[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-0.5 text-left">
      {items.map((kr, i) => (
        <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-slate-600">
          <span className="font-mono font-semibold" style={{ color }}>
            KR{i + 1}
          </span>
          <span>{kr}</span>
        </li>
      ))}
    </ul>
  );
}

/** 色付きヘッダー付きのノード枠。collapsible 指定時はヘッダーに開閉シェブロンを出す。 */
function NodeShell({
  label,
  barColor,
  tintColor,
  ringColor,
  children,
  selected,
  onClick,
  extraHeader,
  collapsible,
  collapsed,
  hiddenCount,
}: {
  label: string;
  barColor: string;
  tintColor: string;
  ringColor?: string;
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  extraHeader?: React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  hiddenCount?: number;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md",
      )}
      style={selected ? { boxShadow: `0 0 0 2px ${ringColor ?? barColor}` } : undefined}
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-1.5 text-white"
        style={{ backgroundColor: barColor }}
      >
        <span className="flex items-center gap-1">
          {collapsible && (
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", !collapsed && "rotate-90")} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-90">{label}</span>
        </span>
        {collapsible && collapsed && hiddenCount ? (
          <span className="rounded bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">＋{hiddenCount}</span>
        ) : (
          extraHeader
        )}
      </div>
      <div className="px-3 py-2.5" style={{ backgroundColor: tintColor }}>
        {children}
      </div>
    </Comp>
  );
}

function MiniProgress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-black/10">
        <span className="block h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[10px] font-bold tabular-nums text-slate-600">
        {done}/{total}
      </span>
    </span>
  );
}

export default function OkrCascade({ board, helpers }: { board: BoardView; helpers: Helpers }) {
  const allIndividuals = useMemo(() => {
    const list: IndividualView[] = [];
    for (const cat of board.categories) {
      for (const sub of cat.subs) {
        for (const dept of sub.departments) list.push(...dept.individuals);
        list.push(...sub.individuals);
      }
      list.push(...cat.individuals);
    }
    return list;
  }, [board]);

  // 折りたためるノード（カテゴリ＋事業＋部署）の全id
  const collapsibleIds = useMemo(() => {
    const ids: string[] = [];
    for (const cat of board.categories) {
      ids.push(cat.id);
      for (const sub of cat.subs) {
        ids.push(sub.id);
        for (const dept of sub.departments) ids.push(dept.id);
      }
    }
    return ids;
  }, [board]);

  // 初期状態：自分の事業カテゴリだけ開き、他はたたむ（コンパクトに）
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const cat of board.categories) {
      if (!cat.isOwnBranch) s.add(cat.id);
    }
    return s;
  });
  const isCollapsed = (id: string) => collapsed.has(id);
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(collapsibleIds));

  const defaultSel =
    allIndividuals.find((i) => i.isSelf)?.id ?? allIndividuals[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(defaultSel);
  const selected = allIndividuals.find((i) => i.id === selectedId) ?? null;

  const doneOf = (ind: IndividualView) => ind.tasks.filter((t) => helpers.getDone(t.id)).length;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, [board, collapsed]);

  const renderIndividual = (ind: IndividualView, accent: string) => {
    const done = doneOf(ind);
    return (
      <li key={ind.id}>
        <NodeShell
          label="個人"
          barColor={INDIV_STYLE.bar}
          tintColor={INDIV_STYLE.tint}
          ringColor={accent}
          selected={selectedId === ind.id}
          onClick={() => setSelectedId(ind.id)}
          extraHeader={<UserIcon className="h-3 w-3" />}
        >
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-900">{ind.name}</p>
            {ind.isSelf && (
              <span className="rounded bg-emerald-600 px-1 py-0.5 text-[9px] font-bold text-white">あなた</span>
            )}
          </div>
          <p className="mb-1.5 mt-0.5 text-[11px] leading-snug text-slate-600">🎯 {ind.objective}</p>
          <div className="flex items-center justify-between">
            <MiniProgress done={done} total={ind.tasks.length} />
            <span className="text-[10px] font-semibold text-emerald-700">やること▾</span>
          </div>
        </NodeShell>
      </li>
    );
  };

  const renderDepartment = (dept: DepartmentView, style: { bar: string; sub: string; tint: string }) => {
    const n = dept.individuals.length;
    const deptCollapsed = isCollapsed(dept.id);
    return (
      <li key={dept.id}>
        <NodeShell
          label="部署"
          barColor={style.sub}
          tintColor={style.tint}
          collapsible={n > 0}
          collapsed={deptCollapsed}
          hiddenCount={n}
          onClick={n > 0 ? () => toggle(dept.id) : undefined}
        >
          <p className="text-sm font-bold text-slate-900">{dept.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{n > 0 ? `${n}名` : "メンバー未登録"}</p>
        </NodeShell>
        {n > 0 && !deptCollapsed && (
          <ul>{dept.individuals.map((ind) => renderIndividual(ind, style.bar))}</ul>
        )}
      </li>
    );
  };

  const renderBusiness = (sub: BusinessView, style: { bar: string; sub: string; tint: string; text: string }) => {
    const childCount = sub.departments.length + sub.individuals.length;
    const subCollapsed = isCollapsed(sub.id);
    return (
      <li key={sub.id}>
        <NodeShell
          label="事業"
          barColor={style.sub}
          tintColor={style.tint}
          collapsible={childCount > 0}
          collapsed={subCollapsed}
          hiddenCount={childCount}
          onClick={childCount > 0 ? () => toggle(sub.id) : undefined}
        >
          <p className="text-sm font-bold text-slate-900">
            {sub.emoji} {sub.name}
          </p>
          <p className="mb-1.5 mt-0.5 text-[11px] leading-snug text-slate-600">🎯 {sub.objective}</p>
          <KRList items={sub.keyResults} color={style.text} />
        </NodeShell>

        {childCount > 0 && !subCollapsed && (
          <ul>
            {sub.departments.map((dept) => renderDepartment(dept, style))}
            {sub.individuals.map((ind) => renderIndividual(ind, style.bar))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {/* 操作バー：ツリーの展開／収束 */}
      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-xs text-slate-400">
          カテゴリ・事業・部署のヘッダーをクリックで開閉できます
        </span>
        <button
          type="button"
          onClick={expandAll}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          すべて展開
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <ChevronsDownUp className="h-3.5 w-3.5" />
          すべて折りたたむ
        </button>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div className="okr-tree mx-auto">
          <ul>
            <li>
              {/* 会社 */}
              <NodeShell label="会社OKR" barColor={COMPANY_STYLE.bar} tintColor={COMPANY_STYLE.tint}>
                <p className="mb-1.5 text-sm font-bold leading-snug text-slate-900">
                  {board.companyOkr.objective}
                </p>
                <KRList items={board.companyOkr.key_results} color={COMPANY_STYLE.text} />
              </NodeShell>

              {board.categories.length > 0 && (
                <ul>
                  {board.categories.map((cat: CategoryView) => {
                    const style = CATEGORY_STYLE[cat.colorKey] ?? CATEGORY_STYLE_DEFAULT;
                    const childCount = cat.subs.length + cat.individuals.length;
                    const catCollapsed = isCollapsed(cat.id);
                    const showChildren = childCount > 0 && !catCollapsed;
                    return (
                      <li key={cat.id}>
                        {/* 事業カテゴリ（色分け・開閉可） */}
                        <NodeShell
                          label="事業カテゴリ"
                          barColor={style.bar}
                          tintColor={style.tint}
                          collapsible={childCount > 0}
                          collapsed={catCollapsed}
                          hiddenCount={childCount}
                          onClick={childCount > 0 ? () => toggle(cat.id) : undefined}
                        >
                          <p className="text-sm font-bold text-slate-900">
                            {cat.emoji} {cat.name}
                          </p>
                          <p className="mb-1.5 mt-0.5 text-[11px] leading-snug text-slate-600">
                            🎯 {cat.objective}
                          </p>
                          <KRList items={cat.keyResults} color={style.text} />
                        </NodeShell>

                        {showChildren && (
                          <ul>
                            {cat.subs.map((sub) => renderBusiness(sub, style))}
                            {cat.individuals.map((ind) => renderIndividual(ind, style.bar))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          </ul>
        </div>
      </div>

      {/* 選択した個人の「やること」パネル */}
      {selected && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
              <ListChecks className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                {selected.name} のやること
                {selected.isSelf && (
                  <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    あなた
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">🎯 {selected.objective}</p>
            </div>
            <span className="text-xs font-bold tabular-nums text-slate-500">
              {doneOf(selected)}/{selected.tasks.length} 完了
            </span>
          </div>

          <div className="space-y-1.5">
            {selected.tasks.length === 0 ? (
              <p className="text-xs text-slate-400">今週のタスクはありません</p>
            ) : (
              selected.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  done={helpers.getDone(t.id)}
                  completedByName={helpers.getCompletedByName(t.id)}
                  canAudit={helpers.canAudit}
                  onToggle={helpers.onToggle}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
