"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light") || document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) setIsDark(false);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      html.classList.add("light");
      html.setAttribute("data-theme", "light");
      setIsDark(false);
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
      setIsDark(true);
    }
  };

  // PLAK ÇALAR BURADAN SİLİNDİ, TERTEMİZ OLDU!
  const navLinks = [
    { name: "Ana Sayfa", href: "/home", icon: "🏠" },
    { name: "Oyun Odası", href: "/games", icon: "🎮" },
    { name: "Sanal Gardırop", href: "/princess", icon: "👗" }, 
    { name: "Rotamız", href: "/memories", icon: "🗺️" }, 
    { name: "Anılar & Planlar", href: "/moments", icon: "📝" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-background/90 backdrop-blur-md border-b border-primary/20 z-50 flex items-center justify-between px-6 transition-all duration-300">
      
      <Link href="/home" className="display-font text-2xl text-primary tracking-widest hover:scale-105 transition-transform">
        E & E
      </Link>

      <button 
        onClick={() => setIsOpen(!isOpen)}
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
                onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-primary/10 ${
                  isActive ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className={`font-bold tracking-wide text-sm ${isActive ? 'text-primary' : 'text-white'}`}>
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
              {isDark ? "Açık Tema" : "Koyu Tema"}
            </span>
            <span className="text-2xl drop-shadow-md">
              {isDark ? "☀️" : "🌙"}
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