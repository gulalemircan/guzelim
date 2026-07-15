import type { Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalMusicPlayer from "@/components/GlobalMusicPlayer"; 
import FloatingChat from "@/components/FloatingChat";
import PwaInit from "@/components/PwaInit"; // YENİ EKLENDİ: PWA motorunu başlatan bileşen

export const metadata = {
  title: "Efsun'un Dünyası",
  description: "Sonsuza dek...",
  manifest: "/manifest.json", // Telefonun uygulamayı tanımasını sağlar
};

// Mobil yakınlaştırmayı ve klavye açıldığında ekran bozulmalarını engeller
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
      {/* min-h-screen yerine mobil uyumlu min-h-[100dvh] kullanıldı */}
      <body className="bg-background text-text pt-16 min-h-[100dvh] relative">
        
        <Navbar />

        {children}

        {/* EKLENEN KISIMLAR: Chat sağ altta, Müzik sol altta yüzecek */}
        <FloatingChat /> 
        <GlobalMusicPlayer />
        
        {/* YENİ EKLENDİ: Arka plan hizmetlerini (Çevrimdışı mod & Bildirimler) başlatır */}
        <PwaInit /> 

      </body>
    </html>
  );
}