import type {
  UserRow,
  BoardView,
  CategoryView,
  BusinessView,
  IndividualView,
  IndividualRow,
  TaskRow,
  TaskView,
  TaskAreaView,
} from "./types";
import { ROLE_LEVEL, CATEGORY_COLOR_KEY } from "./types";
import {
  CURRENT_WEEK_OF,
  companyOkr,
  businesses,
  individuals,
  tasks,
  taskAreas,
  users,
} from "./data";

// ============================================================================
// ログイン中のユーザーの「見える範囲」に絞って多事業ツリーを組み立てる。
//
// 所属事業は individuals（user_id × business_id）から導出 → 1人が複数事業に所属可。
//
// 可視ルール:
//   会社OKR   … 全員に見える
//   事業      … admin/exec は全部。それ以外は「自分が担当する“全事業”の枝」だけ（union）。
//   個人・タスク … 見える事業内で「自分＋下位のみ」（同格の同僚も上席も見えない）。
//   チェック操作 … 本人 or 管理者(admin)のみ。上位者は閲覧＋完了者確認のみ。
// ============================================================================

function nameOf(userId: string | null): string | null {
  if (!userId) return null;
  return users.find((u) => u.id === userId)?.name ?? null;
}

/** そのユーザーが所属する business_id の集合（individuals から導出）。 */
function userBusinessIds(userId: string): Set<string> {
  return new Set(individuals.filter((i) => i.user_id === userId).map((i) => i.business_id));
}

function toTaskView(t: TaskRow, viewer: UserRow) {
  const editable = viewer.role === "admin" || t.assignee_id === viewer.id;
  return {
    ...t,
    assigneeName: nameOf(t.assignee_id) ?? "—",
    completedByName: nameOf(t.completed_by),
    editable,
  };
}

/**
 * 個人のタスクを業務エリア別にまとめる。
 * エリアが定義された事業では全エリア（空も）を並べ、末尾に未分類（あれば）を足す。
 * エリア未定義の事業では空配列を返す（＝グループ分けせずフラット表示）。
 */
function areaGroupsFor(businessId: string, indTasks: TaskView[]): TaskAreaView[] {
  const areas = taskAreas
    .filter((a) => a.business_id === businessId)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (areas.length === 0) return [];
  const groups: TaskAreaView[] = areas.map((a) => ({
    id: a.id,
    name: a.name,
    tasks: indTasks.filter((t) => t.area_id === a.id),
  }));
  const unclassified = indTasks.filter((t) => !t.area_id);
  if (unclassified.length > 0) {
    groups.push({ id: "__none", name: "未分類", tasks: unclassified });
  }
  return groups;
}

/** 指定 business に属する個人ビュー（role 可視 ＋ タスク組み立て）。 */
function individualsFor(businessId: string, viewer: UserRow, weekOf: string): IndividualView[] {
  const isAllSeer = viewer.role === "admin" || viewer.role === "exec";
  return individuals
    .filter((ind) => ind.business_id === businessId)
    .map((ind) => ({ ind, owner: users.find((u) => u.id === ind.user_id) }))
    .filter((x): x is { ind: IndividualRow; owner: UserRow } => {
      if (!x.owner) return false;
      if (isAllSeer) return true;
      // 自分＋下位だけ（同格の同僚も上席も見えない）
      return x.owner.id === viewer.id || ROLE_LEVEL[x.owner.role] > ROLE_LEVEL[viewer.role];
    })
    .sort((a, b) => ROLE_LEVEL[a.owner.role] - ROLE_LEVEL[b.owner.role])
    .map(({ ind, owner }) => {
      const myTasks = tasks
        .filter((t) => t.individual_id === ind.id && t.week_of === weekOf)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => toTaskView(t, viewer));
      return {
        id: ind.id,
        name: owner.name,
        title: owner.title,
        role: owner.role,
        isSelf: owner.id === viewer.id,
        objective: ind.objective,
        keyResults: ind.key_results,
        tasks: myTasks,
        areaGroups: areaGroupsFor(ind.business_id, myTasks),
      };
    });
}

export function buildBoard(
  viewer: UserRow,
  weekOf: string = CURRENT_WEEK_OF,
): BoardView {
  const isAllSeer = viewer.role === "admin" || viewer.role === "exec";
  const canAudit = isAllSeer || viewer.role === "manager";
  const viewerBiz = userBusinessIds(viewer.id);

  const categoryRows = businesses
    .filter((b) => b.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const categories: CategoryView[] = [];

  for (const cat of categoryRows) {
    const subRows = businesses
      .filter((b) => b.parent_id === cat.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    // このカテゴリ配下（カテゴリ自身 or いずれかのサブ）に viewer の担当があるか
    const viewerInCategory =
      viewerBiz.has(cat.id) || subRows.some((s) => viewerBiz.has(s.id));
    const onBranch = isAllSeer || viewerInCategory;
    if (!onBranch) continue;

    const visibleSubs = subRows.filter((sub) => isAllSeer || viewerBiz.has(sub.id));

    const subViews: BusinessView[] = visibleSubs.map((sub) => ({
      id: sub.id,
      name: sub.name,
      emoji: sub.emoji,
      objective: sub.objective,
      keyResults: sub.key_results,
      isOwn: viewerBiz.has(sub.id),
      individuals: individualsFor(sub.id, viewer, weekOf),
    }));

    categories.push({
      id: cat.id,
      name: cat.name,
      emoji: cat.emoji,
      objective: cat.objective,
      keyResults: cat.key_results,
      colorKey: CATEGORY_COLOR_KEY[cat.id] ?? "slate",
      isOwnBranch: viewerInCategory,
      subs: subViews,
      // サブを持たないカテゴリ（コミュニティ／コンサル）はカテゴリ直下の個人を出す
      individuals: individualsFor(cat.id, viewer, weekOf),
    });
  }

  return { companyOkr, categories, canAudit };
}
