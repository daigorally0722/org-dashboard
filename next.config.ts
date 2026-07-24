import type { NextConfig } from "next";

// GitHub Pages はサブパス（/org-dashboard/）で配信するため basePath が必要。
// Netlify はルート配信なので basePath なし。DEPLOY_TARGET=github のときだけ付与する。
const isGithubPages = process.env.DEPLOY_TARGET === "github";

const nextConfig: NextConfig = {
  // 全画面がクライアント側で完結するため、静的サイトとして書き出す。
  output: "export",
  images: { unoptimized: true },
  ...(isGithubPages
    ? { basePath: "/org-dashboard", assetPrefix: "/org-dashboard/" }
    : {}),
};

export default nextConfig;
