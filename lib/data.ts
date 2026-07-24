import type {
  UserRow,
  CompanyOkrRow,
  BusinessRow,
  IndividualRow,
  TaskRow,
  TaskAreaRow,
} from "./types";

// ============================================================================
// シードデータ（多事業：会社 → 事業カテゴリ → 事業(サブ) → 個人 → タスク）
//
// ・OKR（会社・事業の目標）＝月次（2026年8月）。
// ・タスク（やること）＝週次で回す実行単位。CURRENT_WEEK_OF は8月の週。
// ・1人が複数事業に所属できる（individuals を user_id × business_id で複数持つ）。
//
// 簡易ログインのデモ用暗証番号（本番は Supabase Auth に置換）:
//   金澤太良(CEO)=2222 / 松山大吾(COO)=1111 / 石川(事業代表)=4444
//   鈴木=7777 / インターン=5555 / （TBD）=0000
// ============================================================================

/** 対象月（OKRの時間軸）。 */
export const CURRENT_MONTH_LABEL = "2026年8月";
/** 今週（タスクの時間軸）＝8月第1週の月曜。 */
export const CURRENT_WEEK_OF = "2026-08-03";

export const users: UserRow[] = [
  { id: "u-taira", name: "金澤 太良", role: "exec", title: "CEO", passcode: "2222" },
  { id: "u-daigo", name: "松山 大吾", role: "admin", title: "COO", passcode: "1111" },
  { id: "u-ishikawa", name: "石川", role: "manager", title: "事業代表", passcode: "4444" },
  { id: "u-suzuki", name: "鈴木", role: "member", title: "社員", passcode: "7777" },
  { id: "u-intern", name: "インターン", role: "intern", title: "インターン", passcode: "5555" },
  { id: "u-tbd", name: "（TBD）", role: "member", title: "未定", passcode: "0000" },
];

export const companyOkr: CompanyOkrRow = {
  id: "okr-company-2026-08",
  quarter: CURRENT_MONTH_LABEL,
  objective: "8月、SAILX全体で売上150万円を達成する",
  key_results: ["8月の会社売上 ¥1,500,000"],
};

// ── businesses（カテゴリ = parent_id:null／サブ = parent_id:カテゴリid）──
export const businesses: BusinessRow[] = [
  // ① 英会話事業（青）＋サブ3
  {
    id: "biz-english", name: "英会話事業", emoji: "🗣️", parent_id: null,
    objective: "8月、英会話事業で売上¥820,000を達成する",
    key_results: ["8月売上目標 ¥820,000（主にスキルゲット）"],
    sort_order: 1,
  },
  {
    id: "biz-skillget", name: "スキルゲットEnglish", emoji: "✂️", parent_id: "biz-english",
    objective: "新規法人と継続で英会話事業の売上を牽引する",
    key_results: ["8月の新規・継続で¥820,000に貢献する"],
    sort_order: 1,
  },
  {
    id: "biz-habatake", name: "羽ばたけ", emoji: "🕊️", parent_id: "biz-english",
    objective: "SNS→LINEで個人受講を集める【暫定】",
    key_results: ["8月は補助（売上目標 0〜）【暫定】"],
    sort_order: 2,
  },
  {
    id: "biz-chinese", name: "中国語", emoji: "🇨🇳", parent_id: "biz-english",
    objective: "中国語対応ニーズを取り込む【暫定】",
    key_results: ["8月は補助（売上目標 0〜）【暫定】"],
    sort_order: 3,
  },

  // ② AI事業（紫）＋サブ2
  {
    id: "biz-ai", name: "AI事業", emoji: "🤖", parent_id: null,
    objective: "8月、AI事業で売上¥400,000を達成する",
    key_results: ["8月売上目標 ¥400,000"],
    sort_order: 2,
  },
  {
    id: "biz-fwai", name: "FwAI", emoji: "🧠", parent_id: "biz-ai",
    objective: "教材・導入先向けAI研修（クロード研修）を提供する【暫定】",
    key_results: ["導入先での研修を回す【暫定】"],
    sort_order: 1,
  },
  {
    id: "biz-cvc", name: "シンプルなAI研修（CVC AI研修）", emoji: "🎛️", parent_id: "biz-ai",
    objective: "サロン等向けのシンプルなAI研修を月次で回す【暫定・要確認】",
    key_results: ["8月の研修を実施する【暫定】"],
    sort_order: 2,
  },

  // ③ コミュニティ事業（橙・サブなし）
  {
    id: "biz-community", name: "コミュニティ事業", emoji: "👥", parent_id: null,
    objective: "8月は土台づくりに投資する（売上目標なし）【暫定・OEM Connectの可能性は要確認】",
    key_results: ["8月売上目標 ¥0（投資フェーズ）"],
    sort_order: 3,
  },

  // ④ コンサル事業（緑・サブなし）
  {
    id: "biz-consul", name: "コンサル事業", emoji: "🧭", parent_id: null,
    objective: "8月、コンサル事業で売上¥280,000を達成する",
    key_results: ["8月売上目標 ¥280,000"],
    sort_order: 4,
  },
];

// ── individuals（1人が複数事業に所属できる：user_id × business_id）──
export const individuals: IndividualRow[] = [
  // 石川：英会話（スキルゲット）
  {
    id: "ind-ishikawa-skillget", user_id: "u-ishikawa", business_id: "biz-skillget",
    objective: "英会話事業の代表として、集客〜受講運営を回す",
    key_results: ["今週の実行タスクをすべて完了する"],
  },
  // 石川：コンサル
  {
    id: "ind-ishikawa-consul", user_id: "u-ishikawa", business_id: "biz-consul",
    objective: "コンサル案件（soulage KL）のSNS運用を立ち上げる",
    key_results: ["リール月7・ストーリー毎日・ポスト月15で運用する（インスタ＋小紅書）"],
  },
  // 大吾：AI（FwAI）＝初心者コース担当
  {
    id: "ind-daigo-fwai", user_id: "u-daigo", business_id: "biz-fwai",
    objective: "FwAI（クロード研修）の初心者コースを担当する",
    key_results: ["初心者コースを運営する"],
  },
  // 太良：AI（FwAI）＝中級者コース〜成約まで担当
  {
    id: "ind-taira-fwai", user_id: "u-taira", business_id: "biz-fwai",
    objective: "FwAI（クロード研修）の中級者コース〜成約までを担当する",
    key_results: ["中級者コースの提供と成約を進める"],
  },
  // 大吾：コミュニティ
  {
    id: "ind-daigo-community", user_id: "u-daigo", business_id: "biz-community",
    objective: "コミュニティの立ち上げを主導する",
    key_results: ["立ち上げの要所を決める"],
  },
  // 石川：AI（CVC＝ノーマル/シンプルAI研修）
  {
    id: "ind-ishikawa-cvc", user_id: "u-ishikawa", business_id: "biz-cvc",
    objective: "ノーマルAI研修（シンプルAI研修）の授業を回す",
    key_results: ["授業資料を用意し、授業を実施する"],
  },
  // 鈴木：コミュニティ
  {
    id: "ind-suzuki-community", user_id: "u-suzuki", business_id: "biz-community",
    objective: "コミュニティのメンバー集めと運営を担う",
    key_results: ["100人グループを組成する"],
  },
  // インターン：コミュニティ
  {
    id: "ind-intern-community", user_id: "u-intern", business_id: "biz-community",
    objective: "コンテンツ制作でコミュニティを支える",
    key_results: ["創始者の動画を仕上げる"],
  },
];

// ── task_areas（業務エリア＝タスクのグループ）。今はスキルゲットのみ定義 ──
export const taskAreas: TaskAreaRow[] = [
  { id: "area-sg-teacher", business_id: "biz-skillget", name: "先生管理", sort_order: 1 },
  { id: "area-sg-student", business_id: "biz-skillget", name: "生徒管理", sort_order: 2 },
  { id: "area-sg-coach", business_id: "biz-skillget", name: "コーチング", sort_order: 3 },
  { id: "area-sg-sns", business_id: "biz-skillget", name: "SNS", sort_order: 4 },
];

export const tasks: TaskRow[] = [
  // 英会話＞スキルゲット（石川）── 業務エリア別（上限なしで全表示）
  mk("t-sg-1", "ind-ishikawa-skillget", "biz-skillget", "area-sg-sns", "u-ishikawa", "インスタ運用", "medium", null, true, "u-ishikawa"),
  mk("t-sg-2", "ind-ishikawa-skillget", "biz-skillget", "area-sg-coach", "u-ishikawa", "コーチング", "high", null, false),
  mk("t-sg-3", "ind-ishikawa-skillget", "biz-skillget", "area-sg-teacher", "u-ishikawa", "講師管理", "medium", null, false),
  mk("t-sg-4", "ind-ishikawa-skillget", "biz-skillget", "area-sg-student", "u-ishikawa", "生徒管理", "high", null, false),
  mk("t-sg-5", "ind-ishikawa-skillget", "biz-skillget", "area-sg-sns", "u-ishikawa", "アポどり", "high", null, false),
  mk("t-sg-6", "ind-ishikawa-skillget", "biz-skillget", "area-sg-coach", "u-ishikawa", "宿題・教材作成", "medium", null, false),

  // AI事業（エリア未定義＝area_id:null）
  //  FwAI=大吾(初心者コース)＋太良(中級者コース〜成約) / ノーマルAI研修(CVC)=石川
  mk("t-ai-daigo", "ind-daigo-fwai", "biz-fwai", null, "u-daigo", "クロード研修 初心者コースを担当（FwAI）", "medium", null, false),
  mk("t-ai-taira", "ind-taira-fwai", "biz-fwai", null, "u-taira", "クロード研修 中級者コース〜成約までを担当（FwAI）", "high", null, false),
  mk("t-ai-cvc", "ind-ishikawa-cvc", "biz-cvc", null, "u-ishikawa", "AI研修 授業資料の作成（ノーマル/シンプルAI研修・授業日は事前確定）", "high", null, false),

  // コミュニティ事業
  mk("t-com-daigo", "ind-daigo-community", "biz-community", null, "u-daigo", "アンバサダーを決める", "high", null, false),
  mk("t-com-suzuki", "ind-suzuki-community", "biz-community", null, "u-suzuki", "マレーシア留学生（日本人）100人をグループに入れる", "high", null, false),
  mk("t-com-intern", "ind-intern-community", "biz-community", null, "u-intern", "創始者の動画編集", "medium", null, true, "u-intern"),

  // コンサル事業（石川）── soulage KL（8月中旬オープン）SNS運用：インスタ＋小紅書 両方
  mk("t-con-reel", "ind-ishikawa-consul", "biz-consul", null, "u-ishikawa", "soulage：リールを月7本投稿（インスタ＋小紅書）", "high", null, false),
  mk("t-con-story", "ind-ishikawa-consul", "biz-consul", null, "u-ishikawa", "soulage：ストーリーを毎日投稿（インスタ＋小紅書）", "high", null, false),
  mk("t-con-post", "ind-ishikawa-consul", "biz-consul", null, "u-ishikawa", "soulage：フィード投稿を月15本（インスタ＋小紅書）", "medium", null, false),
];

/** タスク生成ヘルパー。done=true のとき completed_by / completed_at を埋める（監査用）。 */
function mk(
  id: string,
  individual_id: string,
  business_id: string,
  area_id: string | null,
  assignee_id: string,
  title: string,
  priority: TaskRow["priority"],
  manual_url: string | null,
  done: boolean,
  completed_by?: string,
): TaskRow {
  return {
    id,
    individual_id,
    business_id,
    area_id,
    assignee_id,
    title,
    priority,
    manual_url,
    done,
    completed_by: done ? completed_by ?? assignee_id : null,
    completed_at: done ? "2026-08-04T10:00:00+09:00" : null,
    week_of: CURRENT_WEEK_OF,
    sort_order: 0,
  };
}
