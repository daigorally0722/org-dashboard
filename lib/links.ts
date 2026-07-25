import type { ExternalLinkRow } from "./types";

// ============================================================================
// 外部ツールへのリンク集（Drive / Notion / GitHub など）。
// url を空にすると「URL未設定」プレースホルダとして表示（後から設定）。
// ※ 本当のライブ同期（Driveの中身を自動取得等）は OAuth＋バックエンドが必要。
//    まずはリンクで各ツールへ飛べる形にする。
// ============================================================================

export const externalLinks: ExternalLinkRow[] = [
  {
    id: "lnk-github",
    name: "org-dashboard（このアプリのソース）",
    tool: "github",
    url: "https://github.com/daigorally0722/org-dashboard",
    note: "GitHubリポジトリ",
  },
  {
    id: "lnk-drive",
    name: "Google Drive（作業効率）",
    tool: "drive",
    url: "",
    note: "DriveフォルダのURLをここに設定してください",
  },
  {
    id: "lnk-notion",
    name: "Notion（社内ナレッジ）",
    tool: "notion",
    url: "",
    note: "NotionのURLをここに設定してください",
  },
];
