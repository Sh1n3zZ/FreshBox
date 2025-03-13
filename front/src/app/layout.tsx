import type { Metadata } from "next";
import { Toaster } from "sonner";
import { fontLinks } from "@/lib/fonts";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreshBox",
  description: "可持续生活方式的践行者",
  other: {
    ...Object.fromEntries(
      fontLinks.map((link, index) => [
        `font-${index}`,
        JSON.stringify(link),
      ])
    ),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-misans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
