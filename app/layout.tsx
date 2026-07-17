import type { Metadata } from "next";
import { Inter, Montserrat, Bitcount_Grid_Single } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/progress-bar";

import { ServerNotice } from "@/components/server-notice";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const bitcount = Bitcount_Grid_Single({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bitcount",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nonacola3-portfolio.vercel.app"),
  title: {
    default: "nonacola3 — Video Portfolio",
    template: "%s — nonacola3",
  },
  description: "nonacola3 的视频作品集：精选 PV / 影像创作项目。",
  openGraph: {
    title: "nonacola3 — Video Portfolio",
    description: "nonacola3 的视频作品集：精选 PV / 影像创作项目。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark" style={{ backgroundColor: "#0a0a0a" }}>
      <body className={`${inter.className} ${montserrat.variable} ${bitcount.variable} bg-[#0a0a0a] text-white antialiased`}>
        <PageTransition />
        <ServerNotice />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
