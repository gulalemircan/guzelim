"use client";
import { useState, useEffect } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const [isDoorsClosed, setIsDoorsClosed] = useState(true);
  const [showLilies, setShowLilies] = useState(false);

  useEffect(() => {
    // Sayfa değiştiğinde önce kapıları kapat
    setIsDoorsClosed(true);
    setShowLilies(false);

    // 300ms sonra kapıları aç ve lilyumları düşür
    const timer1 = setTimeout(() => {
      setIsDoorsClosed(false);
      setShowLilies(true);
      // MOBİL DÜZELTMESİ: Otomatik açılış sesi (playSound) buradan kaldırıldı.
      // Çünkü telefonlar kullanıcı ekrana dokunmadan otomatik ses çalınırsa tüm siteyi kilitliyor.
    }, 300);

    // Zambaklar hızlıca düşüp bittikten sonra DOM'u temizle
    const timer2 = setTimeout(() => {
      setShowLilies(false);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <>
      {/* SİNEMATİK SAYFA KAPILARI (DOLAP GİBİ) */}
      <div 
        className="fixed top-0 left-0 w-1/2 h-full bg-card border-r-2 border-primary/30 z-[999] shadow-[10px_0_20px_rgba(0,0,0,0.5)] transition-transform duration-[800ms] ease-in-out flex items-center justify-end"
        style={{
          transform: isDoorsClosed ? 'translateX(0)' : 'translateX(-110%)',
          willChange: 'transform', /* Telefonda kasma yapmasını engeller */
          pointerEvents: isDoorsClosed ? 'auto' : 'none' /* Kapı açılınca ekrana tıklanabilmesini garantiler */
        }}
      >
        <div className="text-primary text-3xl font-bold tracking-widest mr-4 display-font">E &</div>
      </div>
      
      <div 
        className="fixed top-0 right-0 w-1/2 h-full bg-card border-l-2 border-primary/30 z-[999] shadow-[-10px_0_20px_rgba(0,0,0,0.5)] transition-transform duration-[800ms] ease-in-out flex items-center justify-start"
        style={{
          transform: isDoorsClosed ? 'translateX(0)' : 'translateX(110%)',
          willChange: 'transform',
          pointerEvents: isDoorsClosed ? 'auto' : 'none'
        }}
      >
         <div className="text-primary text-3xl font-bold tracking-widest ml-4 display-font">& E</div>
      </div>

      {/* SAF CSS İLE HIZLICA DÜŞÜP KAYBOLAN LİLYUMLAR */}
      <style>{`
        @keyframes fallFast {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        .lilyum-fast {
          position: fixed;
          top: -10%;
          font-size: 2rem;
          pointer-events: none;
          z-index: 998;
          animation-name: fallFast;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); 
          animation-iteration-count: 1; 
          animation-fill-mode: forwards;
        }
      `}</style>

      {showLilies && (
        <div className="fixed inset-0 pointer-events-none z-[998]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className="lilyum-fast drop-shadow-xl"
              style={{
                left: `${Math.random() * 90 + 5}%`, 
                animationDuration: `${Math.random() * 1.5 + 1.5}s`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            >
              🌸
            </div>
          ))}
        </div>
      )}

      {/* Hangi sayfadaysak onun içeriği buraya gelir */}
      {children}
    </>
  );
}