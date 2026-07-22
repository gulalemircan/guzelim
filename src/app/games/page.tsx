"use client";
import Link from "next/link";

const GAMES = [
  { 
    id: "memory", 
    name: "Renk Hafıza", 
    icon: "🎨", 
    desc: "Sırayı aklında tut, renkleri doğru tahmin et." 
  },
  { 
    id: "taboo", 
    name: "Tabu", 
    icon: "🗣️", 
    desc: "Yasaklı kelimeleri kullanmadan Efsun'a anlat bakalım!" 
  },
  { 
    id: "wordle", 
    name: "Wordle", 
    icon: "📝", 
    desc: "Günün 5 harfli gizli kelimesini 6 denemede bul." 
  },
  { 
    id: "isim-sehir", 
    name: "İsim Şehir", 
    icon: "🌍", 
    desc: "Kağıt kalemi bırakın, efsane klasiği buradan oynayın." 
  },
  { 
    id: "ben-kimim", 
    name: "Ben Kimim?", 
    icon: "🎭", 
    desc: "Yüz yüze oynamalık, bol kahkahalı dijital tahmin oyunu!" 
  },
  { 
    id: "uno", 
    name: "Uno", 
    icon: "🃏", 
    desc: "Özel 2 kişilik kurallarla, kavga garantili kart düellosu!" 
  }
];

export default function GamesPage() {
  return (
    <main className="p-5 md:p-10 animate-in fade-in duration-500 pb-24 min-h-screen bg-background">
      
      {/* Oyun Kolu için Özel Sallanma Animasyonu */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          75% { transform: rotate(12deg); }
        }
        .animate-wiggle { animation: wiggle 2.5s ease-in-out infinite; display: inline-block; }
      `}} />

      <div className="max-w-5xl mx-auto">
        
        {/* YENİ BAŞLIK TASARIMI (Büyük Oyun Kolu Üstte, Ortalanmış) */}
        <div className="w-full flex flex-col items-center justify-center mb-12">
          <span className="text-7xl mb-4 animate-wiggle origin-bottom drop-shadow-xl">🎮</span>
          <h2 className="display-font text-4xl text-primary tracking-wide">Oyun Odası</h2>
        </div>

        {/* KART SİSTEMİ (Artık 6 oyunumuz var!) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {GAMES.map((game) => (
            <Link 
              href={`/games/${game.id}`} 
              key={game.id}
              className="bg-card rounded-[32px] p-8 border border-primary/20 shadow-xl hover:border-primary/50 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 ease-out flex items-center gap-6 group will-change-transform"
            >
              {/* İkon Kutusu */}
              <div className="w-20 h-20 rounded-[20px] bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl shrink-0 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                {game.icon}
              </div>
              
              {/* Yazı Alanı */}
              <div className="flex flex-col justify-center">
                <h3 className="display-font text-2xl text-primary mb-2">{game.name}</h3>
                <p className="text-sm text-text/70 font-medium leading-relaxed pr-2">
                  {game.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
        
      </div>
    </main>
  );
}