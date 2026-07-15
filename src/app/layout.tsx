import type { Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalMusicPlayer from "@/components/GlobalMusicPlayer"; 
import FloatingChat from "@/components/FloatingChat";
import PwaInit from "@/components/PwaInit"; 

export const metadata = {
  title: "Efsun'un Dünyası",
  description: "Sonsuza dek...",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false, 
  themeColor: "#0f172a", 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-background text-text pt-16 min-h-[100dvh] relative">
        
        <Navbar />

        {children}

        <FloatingChat /> 
        <GlobalMusicPlayer />
        <PwaInit /> 

      </body>
    </html>
  );
}