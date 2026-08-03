// components/Navbar.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { playSound } from "@/utils/audio";

type Theme = "default" | "dark" | "retro";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("default");
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as Theme;
    if (savedTheme && ["default", "dark", "retro"].includes(savedTheme)) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    playSound("click");
    const html = document.documentElement;
    let nextTheme: Theme = "default";
    
    if (theme === "default") nextTheme = "dark";
    else if (theme === "dark") nextTheme = "retro";
    else nextTheme = "default";

    html.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
    localStorage.setItem("app-theme", nextTheme);
  };

  const getThemeInfo = () => {
     if (theme === "default") return { name: "Varsayılan", icon: "🍷" };
     if (theme === "dark") return { name: "Gece Modu", icon: "🌙" };
     return { name: "Nostalji", icon: "📜" }; 
  };

  const { name: themeName, icon: themeIcon } = getThemeInfo();

  // YENİ SAYFAMIZ BURAYA EKLENDİ 🚀
  const navLinks = [
    { name: "Ana Sayfa", href: "/home", icon: "🏠" },
    { name: "Oyun Odası", href: "/games", icon: "🎮" },
    { name: "Kozmik Oda", href: "/trip-odasi", icon: "🌌" }, 
    { name: "Sanal Gardırop", href: "/princess", icon: "👗" }, 
    { name: "Rotamız", href: "/memories", icon: "🗺️" }, 
    { name: "Günlük", href: "/gunluk", icon: "📔" }, // İSİM, İKON VE LİNK DEĞİŞTİ
  ];

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-background/90 backdrop-blur-md border-b border-primary/20 z-50 flex items-center justify-between px-6 transition-all duration-300">
      
      <Link href="/home" onClick={() => playSound("click")} className="display-font text-2xl text-primary tracking-widest hover:scale-105 transition-transform">
        E & E
      </Link>

      <button 
        onClick={() => { setIsOpen(!isOpen); playSound("click"); }}
        className="text-primary p-2 focus:outline-none hover:scale-110 transition-transform flex flex-col gap-1.5 z-[60]"
      >
        <span className={`block w-6 h-[2px] bg-primary transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[8px]' : ''}`}></span>
        <span className={`block w-6 h-[2px] bg-primary transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block w-6 h-[2px] bg-primary transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[8px]' : ''}`}></span>
      </button>

      <div 
        className={`absolute top-16 right-4 w-64 bg-card border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-top-right ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col py-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href}
                onClick={() => { setIsOpen(false); playSound("click"); }} 
                className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-primary/10 ${
                  isActive ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className={`font-bold tracking-wide text-sm ${isActive ? 'text-primary' : 'text-text opacity-90 hover:opacity-100'}`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-primary/20 p-4 bg-background/50">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            className="w-full flex items-center justify-between bg-card border border-primary/30 p-3 rounded-xl hover:bg-primary/10 transition-colors shadow-sm active:scale-95"
          >
            <span className="text-sm font-bold text-primary uppercase tracking-widest">
              {themeName}
            </span>
            <span className="text-2xl drop-shadow-md">
              {themeIcon}
            </span>
          </button>
        </div>
        
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-transparent z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </nav>
  );
}