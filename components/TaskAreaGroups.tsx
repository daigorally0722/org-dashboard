import type { TaskAreaView, TaskView } from "@/lib/types";
import TaskRow from "./TaskRow";

// ============================================================================
// TaskAreaGroups — 個人の「やること」を業務エリア別に表示する。
// ・areaGroups があればエリア小見出し＋タスク（空エリアは「タスク未登録」を薄く表示）。
// ・areaGroups が空（エリア未定義の事業）なら tasks をフラット表示。
// ============================================================================

interface Props {
  areaGroups: TaskAreaView[];
  tasks: TaskView[];
  getDone: (id: string) => boolean;
  getCompletedByName: (id: string) => string | null;
  canAudit: boolean;
  onToggle: (id: string) => void;
}

export default function TaskAreaGroups({
  areaGroups,
  tasks,
  getDone,
  getCompletedByName,
  canAudit,
  onToggle,
}: Props) {
  const renderRow = (t: TaskView) => (
    <TaskRow
      key={t.id}
      task={t}
      done={getDone(t.id)}
      completedByName={getCompletedByName(t.id)}
      canAudit={canAudit}
      onToggle={onToggle}
    />
  );

  // エリア未定義の事業：フラット表示
  if (areaGroups.length === 0) {
    if (tasks.length === 0) {
      return <p className="text-xs text-slate-400">今週のタスクはありません</p>;
    }
    return <div className="space-y-1.5">{tasks.map(renderRow)}</div>;
  }

  // 業務エリア別表示（空エリアも箱として表示）
  return (
    <div className="space-y-4">
      {areaGroups.map((area) => (
        <section key={area.id}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {area.name}
            </h4>
            {area.tasks.length > 0 && (
              <span className="text-[10px] font-medium tabular-nums text-slate-400">
                {area.tasks.filter((t) => getDone(t.id)).length}/{area.tasks.length}
              </span>
            )}
          </div>
          {area.tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-300">
              タスク未登録
            </p>
          ) : (
            <div className="space-y-1.5">{area.tasks.map(renderRow)}</div>
          )}
        </section>
      ))}
    </div>
  );
}
