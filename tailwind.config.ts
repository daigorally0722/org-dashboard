import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // レイヤーを一貫した色で識別する（見た瞬間に理解できるように）
        coo: "#7c3aed", // 紫 = 経営レイヤー
        staff: "#0ea5e9", // 青 = 社員レイヤー
        intern: "#10b981", // 緑 = インターンレイヤー
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
