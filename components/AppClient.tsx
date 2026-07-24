"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, LayoutDashboard, List, LogOut, Network } from "lucide-react";
import type { UserRow } from "@/lib/types";
import { buildBoard } from "@/lib/tree";
import { tasks as seedTasks, users, CURRENT_WEEK_OF, CURRENT_MONTH_LABEL } from "@/lib/data";
import { loadSession, saveSession, clearSession } from "@/lib/auth";
import LoginScreen from "./LoginScreen";
import OkrTree from "./OkrTree";
import OkrCascade from "./OkrCascade";
import ExecutiveOverview from "./ExecutiveOverview";
import { cn } from "@/lib/cn";

// ============================================================================
// AppClient — 認証状態とタスクの完了状態を持つ最上位クライアント。
//
// タスクの完了状態はブラウザ(localStorage)に全社共通で保存し、「誰が完了したか」も
// 記録する。Supabase 接続後は onToggle を tasks テーブルの UPDATE に置き換えれば
// そのまま永続化＆監査できる。
// ============================================================================

const TASK_STORE = "org-dashboard:taskstate:v1";

interface TaskState {
  done: boolean;
  by: string | null; // user_id
  at: string | null;
}

function seedState(): Record<string, TaskState> {
  const map: Record<string, TaskState> = {};
  for (const t of seedTasks) {
    map[t.id] = { done: t.done, by: t.completed_by, at: t.completed_at };
  }
  return map;
}

function nameOf(userId: string | null): string | null {
  if (!userId) return null;
  return users.find((u) => u.id === userId)?.name ?? null;
}

export default function AppClient() {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<UserRow | null>(null);
  const [view, setView] = useState<"overview" | "tree" | "list">("overview");
  const [taskState, setTaskState] = useState<Record<string, TaskState>>(seedState);

  // マウント後にセッションと保存済み完了状態を復元
  useEffect(() => {
    setUser(loadSession());
    try {
      const saved = localStorage.getItem(TASK_STORE);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, TaskState>;
        setTaskState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* 保存が読めない場合は初期値のまま */
    }
    setHydrated(true);
  }, []);

  const persist = (next: Record<string, TaskState>) => {
    try {
      localStorage.setItem(TASK_STORE, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  const login = (u: UserRow) => {
    saveSession(u.id);
    setUser(u);
  };
  const logout = () => {
    clearSession();
    setUser(null);
  };

  const getDone = useCallback((id: string) => taskState[id]?.done ?? false, [taskState]);
  const getCompletedByName = useCallback(
    (id: string) => nameOf(taskState[id]?.by ?? null),
    [taskState],
  );

  const onToggle = useCallback(
    (id: string) => {
      if (!user) return;
      setTaskState((prev) => {
        const cur = prev[id] ?? { done: false, by: null, at: null };
        const nowDone = !cur.done;
        const next = {
          ...prev,
          [id]: nowDone
            ? { done: true, by: user.id, at: new Date().toISOString() }
            : { done: false, by: null, at: null },
        };
        persist(next);
        return next;
      });
    },
    [user],
  );

  const board = useMemo(() => (user ? buildBoard(user, CURRENT_WEEK_OF) : null), [user]);

  // 自分のタスクの進捗
  const myProgress = useMemo(() => {
    if (!user) return { done: 0, total: 0 };
    let total = 0;
    let done = 0;
    for (const t of seedTasks) {
      if (t.assignee_id === user.id) {
        total += 1;
        if (taskState[t.id]?.done) done += 1;
      }
    }
    return { done, total };
  }, [user, taskState]);

  if (!hydrated) {
    return <div className="min-h-screen" aria-hidden />;
  }

  if (!user || !board) {
    return <LoginScreen onLogin={login} />;
  }

  const helpers = {
    currentUser: user,
    canAudit: board.canAudit,
    getDone,
    getCompletedByName,
    onToggle,
  };

  return (
    <div className="app-shell min-h-screen">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="app-header sticky top-0 z-20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 border-r border-slate-200 pr-4">
            <span className="brand-mark grid h-8 w-8 place-items-center rounded-[10px] text-white">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-tight text-slate-950">ORG PULSE<span className="text-blue-600">.</span></p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600/70">Operating system</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="truncate text-xs font-bold text-slate-900">{user.name}</span>
            <p className="truncate text-[10px] text-slate-400">{CURRENT_MONTH_LABEL} 目標 ・ 今週 {CURRENT_WEEK_OF}〜</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] text-slate-500">MY EXECUTION</p>
            <p className="text-sm font-bold tabular-nums text-slate-800">
              {myProgress.done}/{myProgress.total} 完了
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="ログアウト"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            ログアウト
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600/70">Organization intelligence</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-950">{CURRENT_MONTH_LABEL} の目標 ・ 今週のやること</p>
            <p className="text-[11px] text-slate-400">目標=月次（8月） / タスク=今週 {CURRENT_WEEK_OF}〜</p>
          </div>
          <div className="view-switcher inline-flex self-start rounded-xl p-1">
            <button type="button" onClick={() => setView("overview")} className={cn("view-tab", view === "overview" && "view-tab-active")}>
              <LayoutDashboard className="h-3.5 w-3.5" /> 概況
            </button>
            <button type="button" onClick={() => setView("tree")} className={cn("view-tab", view === "tree" && "view-tab-active")}>
              <Network className="h-3.5 w-3.5" /> OKRツリー
            </button>
            <button type="button" onClick={() => setView("list")} className={cn("view-tab", view === "list" && "view-tab-active")}>
              <List className="h-3.5 w-3.5" /> タスク
            </button>
          </div>
        </div>

        {board.canAudit && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-[11px] text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            管理ビュー：下位メンバーの進捗と完了履歴を確認できます。
          </div>
        )}

        {view === "overview" ? (
          <ExecutiveOverview board={board} getDone={getDone} />
        ) : view === "tree" ? (
          <OkrCascade board={board} helpers={helpers} />
        ) : (
          <div className="mx-auto max-w-3xl">
            <OkrTree board={board} helpers={helpers} />
          </div>
        )}

        <footer className="mt-10 border-t border-slate-200 py-5 text-center text-[10px] tracking-[.12em] text-slate-400">
          ORG PULSE® · STRATEGY → ALIGNMENT → EXECUTION
        </footer>
      </main>
    </div>
  );
}
