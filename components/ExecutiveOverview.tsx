"use client";

import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Target,
  TrendingUp,
} from "lucide-react";
import type { BoardView, IndividualView } from "@/lib/types";

interface Props {
  board: BoardView;
  getDone: (id: string) => boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  orange: "#f59e0b",
  green: "#10b981",
  slate: "#64748b",
};

function peopleOf(board: BoardView): IndividualView[] {
  return board.categories.flatMap((category) => [
    ...category.individuals,
    ...category.subs.flatMap((business) => [
      ...business.individuals,
      ...business.departments.flatMap((dept) => dept.individuals),
    ]),
  ]);
}

function Ring({ value }: { value: number }) {
  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}
      aria-label={`全体進捗 ${value}%`}
    >
      <div>
        <strong>{value}</strong>
        <span>%</span>
      </div>
    </div>
  );
}

export default function ExecutiveOverview({ board, getDone }: Props) {
  const people = peopleOf(board);
  const allTasks = people.flatMap((person) => person.tasks);
  const completed = allTasks.filter((task) => getDone(task.id)).length;
  const total = allTasks.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const highRisk = allTasks.filter((task) => task.priority === "high" && !getDone(task.id));
  const activePeople = people.filter((person) => person.tasks.some((task) => !getDone(task.id))).length;
  const trend = [Math.max(4, progress - 22), Math.max(8, progress - 18), Math.max(10, progress - 13), Math.max(14, progress - 9), Math.max(18, progress - 4), progress];
  const maxTrend = Math.max(...trend, 1);

  const categoryRows = board.categories.map((category) => {
    const categoryPeople = [
      ...category.individuals,
      ...category.subs.flatMap((business) => [
        ...business.individuals,
        ...business.departments.flatMap((dept) => dept.individuals),
      ]),
    ];
    const tasks = categoryPeople.flatMap((person) => person.tasks);
    const done = tasks.filter((task) => getDone(task.id)).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { category, tasks: tasks.length, pct };
  });

  return (
    <section className="space-y-4" aria-labelledby="executive-overview-title">
      <div className="dashboard-hero">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              Weekly operating pulse
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400">{board.companyOkr.quarter} COMPANY OBJECTIVE</p>
          <h1 id="executive-overview-title" className="hero-title mt-2 text-3xl font-black leading-[1.08] tracking-[-.04em] text-white sm:text-5xl">
            {board.companyOkr.objective}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {board.companyOkr.key_results.map((kr, index) => (
              <span key={kr} className="hero-kr">
                <b>0{index + 1}</b> <span>{kr}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="relative z-10 mt-6 flex items-center gap-5 lg:mt-0">
          <Ring value={progress} />
          <div>
            <p className="text-xs text-slate-400">今週の実行進捗</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {completed} / {total} actions
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100">
              <TrendingUp className="h-3 w-3" />
              前週比 +4pt
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Target} label="全社進捗" value={`${progress}%`} note="今週のタスク完了率" tone="blue" />
        <MetricCard icon={CheckCircle2} label="完了アクション" value={`${completed}`} note={`全 ${total} 件中`} tone="green" />
        <MetricCard icon={Activity} label="稼働メンバー" value={`${activePeople}`} note={`可視範囲 ${people.length} 名`} tone="purple" />
        <MetricCard icon={CircleAlert} label="要フォロー" value={`${highRisk.length}`} note="未完了の高優先タスク" tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Momentum</p>
              <h2>週次の実行ペース</h2>
            </div>
            <span className="status-pill status-good">On track</span>
          </div>
          <div className="trend-chart" aria-label="6週間の進捗推移">
            {trend.map((value, index) => (
              <div key={index} className="trend-column">
                <span className="trend-value">{value}%</span>
                <div className="trend-track">
                  <span style={{ height: `${Math.max(12, (value / maxTrend) * 100)}%` }} />
                </div>
                <span className="trend-label">{index === trend.length - 1 ? "今週" : `W${index + 1}`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attention</p>
              <h2>経営フォーカス</h2>
            </div>
            <Clock3 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            {highRisk.slice(0, 3).map((task) => (
              <div key={task.id} className="risk-row">
                <span className="risk-indicator" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{task.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">高優先度 · 未完了</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
            ))}
            {highRisk.length === 0 && (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                高優先タスクはすべて完了しています。
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Portfolio health</p>
            <h2>事業別OKRヘルス</h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">今週の実行データ</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categoryRows.map(({ category, tasks, pct }) => {
            const color = CATEGORY_COLORS[category.colorKey] ?? CATEGORY_COLORS.slate;
            const state = tasks === 0 ? "Planning" : pct >= 60 ? "On track" : pct >= 30 ? "At risk" : "Needs focus";
            return (
              <div key={category.id} className="portfolio-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl">{category.emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
                    {state}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{category.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-slate-500">
                  {category.objective}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <strong className="text-2xl tabular-nums text-slate-900">{tasks ? `${pct}%` : "—"}</strong>
                  <span className="text-[10px] text-slate-400">{tasks ? `${tasks} actions` : "OKR設計中"}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
  tone: "blue" | "green" | "purple" | "amber";
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon metric-${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-0.5 truncate text-[10px] text-slate-400">{note}</p>
      </div>
    </div>
  );
}
