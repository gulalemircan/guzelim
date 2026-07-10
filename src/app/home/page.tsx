"use client";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [identity, setIdentity] = useState("");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIdentity(localStorage.getItem("myName") || "");

    const start = new Date(2026, 0, 13, 0, 0, 0).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - start;
      
      if(diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="p-5 animate-in fade-in duration-500">
      <div className="text-[11px] uppercase tracking-[2px] text-primary mb-2.5 font-bold transition-colors">
        Birlikte Geçen Zaman
      </div>
      
      {/* Sayaç Kartı */}
      <div className="bg-card rounded-[24px] p-5 mb-5 border border-primary/20 shadow-xl transition-all">
        <div className="grid grid-cols-4 gap-2 relative z-10">
          <CounterBox num={timeLeft.days} label="Gün" />
          <CounterBox num={timeLeft.hours} label="Saat" />
          <CounterBox num={timeLeft.minutes} label="Dak" />
          <CounterBox num={timeLeft.seconds} label="Saniye" />
        </div>
      </div>

      {/* Ruh Hali Kartı */}
      <div className="bg-card rounded-[24px] p-5 mb-5 border border-primary/20 shadow-xl flex justify-between items-center transition-all">
        <div>
          <h3 className="display-font text-xl m-0 text-primary transition-colors">Efsun Şuan Nasıl?</h3>
          <div className="text-sm mt-1 text-text/80 font-medium">Yükleniyor...</div>
        </div>
        
        {identity === "Efsun" && (
          <button className="bg-primary text-background px-4 py-2 rounded-full text-xs font-bold shadow-md hover:scale-105 transition-all">
            Değiştir
          </button>
        )}
      </div>

      {/* Günün Sözü Kartı */}
      <div className="bg-card rounded-[24px] p-5 mb-5 border border-primary/20 shadow-xl transition-all">
        <h3 className="display-font text-lg m-0 mb-2 text-primary transition-colors">Günün Küçük Sözü</h3>
        <p className="italic text-text/90 leading-relaxed text-sm font-medium">
          "Dünya seninle daha güzel sevgilim."
        </p>
      </div>
    </main>
  );
}

function CounterBox({ num, label }: { num: number; label: string }) {
  return (
    <div className="bg-background border border-primary/20 p-3 rounded-2xl text-center shadow-sm transition-colors">
      <span className="display-font text-2xl text-primary block transition-colors">{num}</span>
      <span className="text-[8px] text-text/70 uppercase tracking-widest block mt-1 font-bold transition-colors">{label}</span>
    </div>
  );
}