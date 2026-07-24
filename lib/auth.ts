import type { UserRow } from "./types";
import { users } from "./data";

// ============================================================================
// 簡易ログイン（名前 ＋ 暗証番号）。
// ⚠️ これは内部試用向けのプロトタイプ認証です。passcode をクライアントで
//    照合しているため、本番のセキュリティはありません。
//    本番では Supabase Auth（メール＋パスワード）に置き換える前提。
// ============================================================================

const SESSION_KEY = "org-dashboard:session";

/** ログイン可能なユーザー一覧（名前選択用。passcode は含めない）。 */
export function listLoginableUsers(): Omit<UserRow, "passcode">[] {
  return users.map(({ passcode: _passcode, ...rest }) => rest);
}

/** 名前(id) ＋ 暗証番号で照合。成功したら user を返す。 */
export function authenticate(userId: string, passcode: string): UserRow | null {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  return user.passcode === passcode.trim() ? user : null;
}

/** ログイン状態を保存（user_id のみ）。 */
export function saveSession(userId: string) {
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch {
    /* localStorage 不可時は何もしない */
  }
}

/** 保存済みセッションから user を復元。 */
export function loadSession(): UserRow | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return users.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}
