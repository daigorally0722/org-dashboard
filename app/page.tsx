import AppClient from "@/components/AppClient";

// ダッシュボード本体。認証と表示の全ては AppClient（Client）が担う。
export default function Home() {
  return <AppClient />;
}
