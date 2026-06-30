import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/progress-bar";
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
