import { ExternalLink, Check, Lock } from "lucide-react";
import type { TaskView } from "@/lib/types";
import { PRIORITY_META } from "@/lib/layers";
import { cn } from "@/lib/cn";

// ============================================================================
// TaskRow — 個人ノードの下にぶら下がる1タスク。
// editable（本人 or 管理者）ならチェック可能。そうでなければ閲覧のみ（ロック表示）。
// canAudit（管理者・リーダー以上）なら「誰が完了したか」を表示する。
// ============================================================================

interface TaskRowProps {
  task: TaskView;
  done: boolean;
  completedByName: string | null;
  canAudit: boolean;
  onToggle: (id: string) => void;
}

export default function TaskRow({
  task,
  done,
  completedByName,
  canAudit,
  onToggle,
}: TaskRowProps) {
  const meta = PRIORITY_META[task.priority];
  const editable = task.editable;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        done ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white",
        editable && "hover:border-slate-300",
      )}
    >
      {editable ? (
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-pressed={done}
          aria-label={done ? "完了を取り消す" : "完了にする"}
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 bg-white hover:border-emerald-400",
          )}
        >
          {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>
      ) : (
        <span
          title="このタスクは本人だけがチェックできます"
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2",
            done
              ? "border-emerald-200 bg-emerald-100 text-emerald-600"
              : "border-slate-200 bg-slate-100 text-slate-300",
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Lock className="h-3 w-3" />}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            done ? "text-slate-400 line-through" : "text-slate-800",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold", meta.className)}>
            {meta.label}
          </span>
          {canAudit && done && completedByName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Check className="h-3 w-3" strokeWidth={3} />
              {completedByName} が完了
            </span>
          )}
        </div>
      </div>

      {task.manual_url && (
        <a
          href={task.manual_url}
          target="_blank"
          rel="noopener noreferrer"
          title="マニュアルを開く"
          className="mt-0.5 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
