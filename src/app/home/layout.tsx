"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme") || "";
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const changeTheme = (themeName: string) => {
    if (themeName === "") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeName);
    }
    localStorage.setItem("selectedTheme", themeName);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen pb-[90px] bg-background text-text transition-colors duration-500">
      
      {/* Sağ Üst Hamburger Menü */}
      <div className="fixed top-5 right-5 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 bg-card/90 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg text-text hover:scale-105 transition-transform"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      {/* Tema Seçim Listesi */}
      {isMenuOpen && (
        <div className="fixed top-20 right-5 bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-4 animate-in slide-in-from-top-2 w-48">
          <h4 className="display-font text-xs uppercase tracking-widest opacity-60 border-b border-primary/20 pb-2 mb-1">Atmosfer Seçimi</h4>
          <ThemeButton icon="🍷" label="Bordo & Altın" onClick={() => changeTheme("")} />
          <ThemeButton icon="♟️" label="Koyu Siyah & Beyaz" onClick={() => changeTheme("koyu-siyah")} />
        </div>
      )}

      {/* Sayfa İçerikleri */}
      {children}
      
      {/* Alt Navigasyon Menüsü */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-primary/20 flex justify-around p-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-40 transition-colors duration-500">
        <NavItem href="/home" icon="🏠" label="Ev" active={pathname === "/home"} />
        <NavItem href="/memories" icon="📍" label="Anılar" active={pathname === "/memories"} />
        <NavItem href="/games" icon="🎮" label="Oyunlar" active={pathname === "/games"} />
        <NavItem href="/princess" icon="✨" label="Efsun" active={pathname === "/princess"} />
      </nav>
    </div>
  );
}

function ThemeButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors w-full cursor-pointer">
      <span>{icon}</span> {label}
    </button>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center flex-1 transition-all duration-300 ${
        active ? "text-primary -translate-y-1 scale-110 font-bold" : "text-text/50"
      }`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </Link>
  );
}