"use client";

import { useState } from "react";
import { BarChart3, LogIn, ShieldCheck } from "lucide-react";
import type { UserRow } from "@/lib/types";
import { listLoginableUsers, authenticate } from "@/lib/auth";
import { cn } from "@/lib/cn";

// ============================================================================
// LoginScreen — 名前を選んで暗証番号を入れる簡易ログイン。
// ⚠️ プロトタイプ認証（本番は Supabase Auth に置換）。
// ============================================================================

export default function LoginScreen({ onLogin }: { onLogin: (u: UserRow) => void }) {
  const people = listLoginableUsers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!selectedId) {
      setError("名前を選んでください");
      return;
    }
    const user = authenticate(selectedId, code);
    if (!user) {
      setError("暗証番号が違います");
      return;
    }
    onLogin(user);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-300">
          <BarChart3 className="h-6 w-6" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Operating system</p>
        <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950">ORG PULSE</h1>
        <p className="mt-1 text-sm text-slate-500">
          OKRと実行状況を、ひとつの視界へ。
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          1. 名前を選ぶ
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedId(p.id);
                setError("");
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                selectedId === p.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="flex-1 text-sm font-semibold text-slate-800">{p.name}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          2. 暗証番号
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="4桁の暗証番号"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <LogIn className="h-4 w-4" />
            ログイン
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-100/70 px-4 py-3 text-xs text-slate-600">
        <p className="font-semibold">デモ用の暗証番号（内部試用）</p>
        <p className="mt-1 leading-relaxed">
          大吾=1111 ／ 太良=2222 ／ 集客リーダー=3333 ／ 石川=4444 ／ インターン=5555 ／ 佐藤=6666 ／ 鈴木=7777。
          本番では一人ひとりのパスワード（Supabase Auth）に置き換えます。
        </p>
      </div>
    </div>
  );
}
