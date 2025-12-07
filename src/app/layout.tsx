import "./globals.css";
import { ReactNode } from "react";

// ✅ 全局 metadata（可选）
export const metadata = {
  title: "SmartPicture",
  description: "AI Tech News & SEO Platform",
};

// ✅ 根 Layout（Next.js 必需）
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
