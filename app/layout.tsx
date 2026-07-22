import type { Metadata } from "next";
import { Inter, Montserrat, Bitcount_Grid_Single, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/progress-bar";

import { ServerNotice } from "@/components/server-notice";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(!sessionStorage.getItem('hero-loaded')){var p=document.createElement('div');p.id='pre-loader';p.style.cssText='position:fixed;inset:0;z-index:9999;background:#0a0a0a;';document.documentElement.appendChild(p);}}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${inter.className} ${geistMono.variable} ${montserrat.variable} ${bitcount.variable} bg-[#0a0a0a] text-white antialiased`}>
        <ToastProvider>
          <PageTransition />
          <ServerNotice />
          <Navbar />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
