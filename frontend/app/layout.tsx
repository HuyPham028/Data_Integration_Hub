import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppWrapper } from "@/components/layout/AppWrapper";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Integration Hub",
  description: "Trục tích hợp dữ liệu đại học",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen overflow-hidden bg-slate-50`}>
        <Toaster richColors position="top-right"/>
        <LanguageProvider>
          <AppWrapper>{children}</AppWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}