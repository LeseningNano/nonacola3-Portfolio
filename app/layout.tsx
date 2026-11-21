import type { Metadata } from "next";
import { Inter, Montserrat, Bitcount_Grid_Single, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { BackNavigationFlag } from "@/components/scroll-memory";
import { PageTransition } from "@/components/progress-bar";

import { ServerNotice } from "@/components/server-notice";
import { ChunkRecovery } from "@/components/chunk-recovery";
import { ToastProvider } from "@/components/toast";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/metadata";
import "./globals.css";

// 中文字体：思源黑体（可变字重，一套文件覆盖常规到半粗）。构建时由 next/font 下载并随站点发布，
// 运行时不访问 Google；Google 已按常用字切片，浏览器只下载页面用到的部分，所以不预加载。
const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], variable: "--font-noto-sans-sc", preload: false });

// Inter / Montserrat / Bitcount 都没有中文字形：中文统一落到思源黑体，再退到各系统的中文字体。
// next/font 的参数必须是字面量，所以三处各写一遍。

const inter = Inter({ subsets: ["latin"], fallback: ["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "sans-serif"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", fallback: ["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "sans-serif"] });
const bitcount = Bitcount_Grid_Single({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bitcount",
  fallback: ["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "sans-serif"],
});
// 后台等宽字；前台不使用，关闭预加载避免前台下载
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s — nonacola3",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "zh_CN",
    images: [{ url: DEFAULT_OG_IMAGE, alt: DEFAULT_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
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
              "(function(){try{if(location.pathname==='/'&&!sessionStorage.getItem('hero-loaded')){var p=document.createElement('div');p.id='pre-loader';p.style.cssText='position:fixed;inset:0;z-index:9999;background:#0a0a0a;';document.documentElement.appendChild(p);}}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${inter.className} ${montserrat.variable} ${bitcount.variable} ${jetbrainsMono.variable} ${notoSansSC.variable} bg-[#0a0a0a] text-white antialiased`}>
        <ToastProvider>
          <ChunkRecovery />
          <PageTransition />
          <ServerNotice />
          <Navbar />
          <BackNavigationFlag />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
