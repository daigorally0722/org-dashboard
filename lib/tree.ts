import type {
  UserRow,
  BoardView,
  CategoryView,
  BusinessView,
  DepartmentView,
  IndividualView,
  IndividualRow,
  TaskRow,
} from "./types";
import { ROLE_LEVEL, CATEGORY_COLOR_KEY } from "./types";
import {
  CURRENT_WEEK_OF,
  companyOkr,
  businesses,
  departments,
  individuals,
  tasks,
  users,
} from "./data";

// ============================================================================
// ログイン中のユーザーの「見える範囲」に絞って多事業ツリーを組み立てる。
//
// 階層: 会社 → 事業カテゴリ → 事業(サブ) →〔部署〕→ 個人 → タスク
//   ・部署は規模の大きい事業（スキルゲット）だけが持つ“1列多い”階層。
//   ・所属事業/部署は individuals（user_id × business_id × department_id）から導出。
//
// 可視ルール:
//   会社OKR   … 全員に見える
//   事業      … admin/exec は全部。それ以外は「自分が担当する“全事業”の枝」だけ（union）。
//   部署      … その事業が見えるなら、部署は箱として全部見える（中の個人は role で絞る）。
//   個人・タスク … 「自分＋下位のみ」（同格の同僚も上席も見えない）。
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
 * 指定 business × department に属する個人ビュー（role 可視 ＋ タスク組み立て）。
 * departmentId=null で「部署なし」の個人（部署を持たない事業の直下）を取得。
 */
function individualsFor(
  businessId: string,
  departmentId: string | null,
  viewer: UserRow,
  weekOf: string,
): IndividualView[] {
  const isAllSeer = viewer.role === "admin" || viewer.role === "exec";
  return individuals
    .filter((ind) => ind.business_id === businessId && ind.department_id === departmentId)
    .map((ind) => ({ ind, owner: users.find((u) => u.id === ind.user_id) }))
    .filter((x): x is { ind: IndividualRow; owner: UserRow } => {
      if (!x.owner) return false;
      if (isAllSeer) return true;
      // 自分＋下位だけ（同格の同僚も上席も見えない）
      return x.owner.id === viewer.id || ROLE_LEVEL[x.owner.role] > ROLE_LEVEL[viewer.role];
    })
    .sort((a, b) => ROLE_LEVEL[a.owner.role] - ROLE_LEVEL[b.owner.role])
    .map(({ ind, owner }) => ({
      id: ind.id,
      name: owner.name,
      title: owner.title,
      role: owner.role,
      isSelf: owner.id === viewer.id,
      objective: ind.objective,
      keyResults: ind.key_results,
      tasks: tasks
        .filter((t) => t.individual_id === ind.id && t.week_of === weekOf)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => toTaskView(t, viewer)),
    }));
}

/** 事業の部署一覧（箱として全部返す。中の個人は role で絞られ、空なら individuals:[]）。 */
function departmentsFor(businessId: string, viewer: UserRow, weekOf: string): DepartmentView[] {
  return departments
    .filter((d) => d.business_id === businessId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => ({
      id: d.id,
      name: d.name,
      individuals: individualsFor(businessId, d.id, viewer, weekOf),
    }));
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
      departments: departmentsFor(sub.id, viewer, weekOf),
      individuals: individualsFor(sub.id, null, viewer, weekOf),
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
      // サブを持たないカテゴリ（コミュニティ／コンサル）はカテゴリ直下の個人を出す（部署なし）
      individuals: individualsFor(cat.id, null, viewer, weekOf),
    });
  }

  return { companyOkr, categories, canAudit };
}
