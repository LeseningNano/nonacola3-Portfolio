import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { MobileWarning } from "@/components/mobile-warning";
import { PageTransition } from "@/components/progress-bar";
import { GlimmProvider } from "glimm/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Video Portfolio",
  description: "Video portfolio website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bitcount+Grid+Single:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${montserrat.variable} bg-[#0a0a0a] text-white antialiased`}>
        <PageTransition />
        <MobileWarning />
        <Navbar />
        <GlimmProvider palette="prism">
          {children}
        </GlimmProvider>
      </body>
    </html>
  );
}
