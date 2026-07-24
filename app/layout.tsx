import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORG PULSE | OKR Operating System",
  description:
    "会社・事業・個人のOKRと今週の実行状況をひとつの視界につなぐ組織運営ダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
