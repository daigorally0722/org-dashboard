// ============================================================================
// データ構造の中心定義（多事業：会社 → 事業カテゴリ → 事業(サブ) → 個人 → タスク）
//
// Row 型はそのまま Supabase テーブルに 1:1 対応。
// businesses テーブルは parent_id で「カテゴリ(親)／サブ事業(子)」の2階層を表現する。
// ============================================================================

/** 役職。数字が小さいほど上位（見える範囲が広い）。 */
export type Role = "admin" | "exec" | "manager" | "member" | "intern";

/** 役職 → レベル値。viewer は「自分のレベル値以上（＝同格か下位）」だけ見える。 */
export const ROLE_LEVEL: Record<Role, number> = {
  admin: 0,
  exec: 1,
  manager: 2,
  member: 3,
  intern: 4,
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "管理者",
  exec: "代表・経営",
  manager: "リーダー",
  member: "社員",
  intern: "インターン",
};

export type Priority = "high" | "medium" | "low";

// ── Supabase テーブル対応の Row 型 ──────────────────────────────────────

/**
 * users テーブル：ログインする人。
 * 所属事業は UserRow には持たせず、individuals（user_id × business_id）から導出する
 * → 1人が複数事業に所属できる（例：大吾=AI＋コミュニティ、石川=英会話＋コンサル）。
 * role/title は画面には出さず、可視範囲・権限判定の内部用途のみ。
 */
export interface UserRow {
  id: string;
  name: string;
  role: Role;
  title: string; // 内部管理用（画面非表示）
  passcode: string;
}

/** company_okr テーブル：会社の四半期OKR（全員に見える）。 */
export interface CompanyOkrRow {
  id: string;
  quarter: string;
  objective: string;
  key_results: string[];
}

/**
 * businesses テーブル：事業。
 * parent_id === null … 事業カテゴリ（英会話 / AI / コミュニティ / コンサル）
 * parent_id === <カテゴリid> … そのカテゴリ配下のサブ事業（スキルゲットEnglish 等）
 * サブを持たないカテゴリ（コミュニティ / コンサル）はカテゴリ自体が1事業ノードになる。
 */
export interface BusinessRow {
  id: string;
  name: string;
  emoji: string;
  parent_id: string | null;
  objective: string;
  key_results: string[];
  sort_order: number;
}

/**
 * departments テーブル：事業内の「部署」（例：スキルゲットの 先生管理/生徒管理/コーチング/SNS）。
 * 規模の大きい事業だけ部署を持つ。持たない事業は 事業→個人 に直結する。
 */
export interface DepartmentRow {
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
}

/**
 * individuals テーブル：個人OKR。business_id はサブ事業（サブが無ければカテゴリ）を指す。
 * department_id … 部署を持つ事業では所属部署を指す（null＝部署なし事業の個人）。
 * ※ 1人が複数部署に関わる場合は（例：代表の石川）、部署ごとに individual レコードを持つ。
 */
export interface IndividualRow {
  id: string;
  user_id: string;
  business_id: string;
  department_id: string | null;
  objective: string;
  key_results: string[];
}

/**
 * tasks テーブル：個人にぶら下がるタスク。
 * assignee_id = 実行担当（本人だけチェック可／admin は代理可）。
 * completed_by / completed_at = 監査用（誰がいつ完了ボタンを押したか）。
 */
export interface TaskRow {
  id: string;
  individual_id: string;
  business_id: string;
  assignee_id: string;
  title: string;
  priority: Priority;
  manual_url: string | null;
  done: boolean;
  completed_by: string | null;
  completed_at: string | null;
  week_of: string;
  sort_order: number;
}

// ── 画面用に組み立てた View 型 ───────────────────────────────────────────

export interface TaskView extends TaskRow {
  assigneeName: string;
  completedByName: string | null;
  editable: boolean;
}

export interface IndividualView {
  id: string;
  name: string;
  title: string;
  role: Role;
  isSelf: boolean;
  objective: string;
  keyResults: string[];
  tasks: TaskView[];
}

/** 部署ノード（事業内の一段）。配下に個人を持つ。空部署も individuals:[] で含める。 */
export interface DepartmentView {
  id: string;
  name: string;
  individuals: IndividualView[];
}

/**
 * サブ事業（または単独事業）ノード。
 * departments を持つ事業（スキルゲット）は departments 経由で個人を表示、
 * 持たない事業は individuals を直接表示する。
 */
export interface BusinessView {
  id: string;
  name: string;
  emoji: string;
  objective: string;
  keyResults: string[];
  isOwn: boolean;
  departments: DepartmentView[];
  individuals: IndividualView[];
}

/** 事業カテゴリノード。subs＝配下のサブ事業、individuals＝カテゴリ直下の個人（コミュニティ等）。 */
export interface CategoryView {
  id: string;
  name: string;
  emoji: string;
  objective: string;
  keyResults: string[];
  colorKey: string; // "blue" | "purple" | "orange" | "green" | "slate"
  isOwnBranch: boolean;
  subs: BusinessView[];
  individuals: IndividualView[];
}

export interface BoardView {
  companyOkr: CompanyOkrRow;
  categories: CategoryView[];
  canAudit: boolean;
}

/** 事業カテゴリ id → 配色キー。 */
export const CATEGORY_COLOR_KEY: Record<string, string> = {
  "biz-english": "blue",
  "biz-ai": "purple",
  "biz-community": "orange",
  "biz-consul": "green",
};
