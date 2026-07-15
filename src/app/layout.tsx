import type { Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalMusicPlayer from "@/components/GlobalMusicPlayer"; 
import FloatingChat from "@/components/FloatingChat";
import PwaInit from "@/components/PwaInit"; 

export const metadata = {
  title: "Efsun'un Dünyası",
  description: "Sonsuza dek...",
  manifest: "/manifest.webmanifest", // Next.js'in manifest.ts'yi derlediği gerçek yol
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
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
      <head>
        {/* Tarayıcıların inatla görmezden gelmesini engellemek için ikonları HTML'e zorla gömüyoruz */}
        <link rel="icon" href="/icon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
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