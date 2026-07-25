// ============================================================================
// 作業効率フォルダの「資料（教材・ドキュメント）」を自動スキャンして
// lib/materials.generated.ts を生成する。npm run build の prebuild で自動実行。
//
// 公開（public GitHub Pages）される前提のため、機微なものは除外する:
//   ・営業/見込みリスト（salons, 営業リスト, prospector など）
//   ・給与（salary）
//   ・CSV/TSV（データ流出防止）
//   ・クライアント名の会議資料フォルダ（*-report）はそもそもフォルダなので対象外
// 対象は「トップレベルの資料ファイル」だけ（サブフォルダ＝プロジェクトは除外）。
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, ".."); // org-dashboard
const workDir = path.resolve(projectDir, ".."); // 作業効率
const outFile = path.join(projectDir, "lib", "materials.generated.ts");

// 資料として扱う拡張子 → カテゴリ
const EXT_CATEGORY = {
  pdf: "教材",
  pptx: "スライド",
  ppt: "スライド",
  xlsx: "データ",
  xls: "データ",
  docx: "ドキュメント",
  doc: "ドキュメント",
  html: "Web資料",
  htm: "Web資料",
  md: "メモ",
};

// 機微なファイル名は除外（公開のため）
const SENSITIVE = /(営業リスト|salons|prospect|salary|給与|顧客リスト|salon_prospector|recruit)/i;

// ファイル名から安定した一意IDを作る（djb2ハッシュ）
function hashId(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) + h + str.charCodeAt(i);
    h |= 0;
  }
  return "mat-" + (h >>> 0).toString(36);
}

function humanSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function collect() {
  let entries;
  try {
    entries = fs.readdirSync(workDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const items = [];
  for (const e of entries) {
    if (!e.isFile()) continue; // フォルダ（プロジェクト/クライアント資料）は除外
    if (e.name.startsWith(".")) continue;
    if (SENSITIVE.test(e.name)) continue;
    const ext = path.extname(e.name).slice(1).toLowerCase();
    const category = EXT_CATEGORY[ext];
    if (!category) continue; // 資料拡張子以外（.py/.js/.csv/.zip 等）は除外
    let stat;
    try {
      stat = fs.statSync(path.join(workDir, e.name));
    } catch {
      continue;
    }
    items.push({
      id: hashId(e.name),
      name: e.name,
      ext,
      category,
      size: humanSize(stat.size),
      updated: stat.mtime.toISOString().slice(0, 10),
    });
  }
  // カテゴリ→名前でソート
  items.sort((a, b) => a.category.localeCompare(b.category, "ja") || a.name.localeCompare(b.name, "ja"));
  return items;
}

const materials = collect();
const banner =
  "// ⚠️ 自動生成ファイル（scripts/gen-materials.mjs）。直接編集しないでください。\n" +
  "// 作業効率フォルダの資料を npm run build 時にスキャンして生成します。\n";

const body =
  banner +
  'import type { MaterialRow } from "./types";\n\n' +
  `export const materialsGeneratedAt = ${JSON.stringify(new Date().toISOString().slice(0, 10))};\n\n` +
  `export const generatedMaterials: MaterialRow[] = ${JSON.stringify(materials, null, 2)};\n`;

fs.writeFileSync(outFile, body, "utf8");
console.log(`gen-materials: ${materials.length} 件の資料を書き出しました → ${path.relative(projectDir, outFile)}`);
