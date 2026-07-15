import type { Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalMusicPlayer from "@/components/GlobalMusicPlayer"; 
import FloatingChat from "@/components/FloatingChat";
import PwaInit from "@/components/PwaInit"; 

export const metadata = {
  title: "Efsun'un Dünyası",
  description: "Sonsuza dek...",
  // DİKKAT: manifest yönlendirmesini buradan kaldırdık, aşağıda zorla gömeceğiz
  icons: {
    icon: "/logo-efsun.png",
    shortcut: "/logo-efsun.png",
    apple: "/logo-efsun.png",
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
        {/* İŞTE VERCEL'İ HACKLEDİĞİMİZ SATIR: use-credentials ile engeli aşıyoruz */}
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
        <link rel="icon" href="/logo-efsun.png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo-efsun.png" />
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