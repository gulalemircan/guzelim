"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

// Ğ ve J gibi zor harfleri eledim ki oyun tıkanmasın :)
const ALPHABET = ["A", "B", "C", "Ç", "D", "E", "F", "G", "H", "I", "İ", "K", "L", "M", "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z"];

const CATEGORIES = [
  { id: "isim", label: "👤 İsim", placeholder: "Örn: Emircan" },
  { id: "sehir", label: "🏙️ Şehir", placeholder: "Örn: Edirne" },
  { id: "hayvan", label: "🐾 Hayvan", placeholder: "Örn: Eşek" },
  { id: "bitki", label: "🌿 Bitki / Meyve", placeholder: "Örn: Elma" },
  { id: "esya", label: "🧦 Eşya", placeholder: "Örn: Eldiven" }
];

export default function IsimSehirPage() {
  const [phase, setPhase] = useState<"settings" | "playing" | "finalResult">("settings");
  
  // Oyun State'leri
  const [targetLetter, setTargetLetter] = useState("A");
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState<Record<string, string>>({
    isim: "", sehir: "", hayvan: "", bitki: "", esya: ""
  });
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Record<string, { word: string, points: number }>>({});

  // Supabase Skorları
  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [selectedPlayer, setSelectedPlayer] = useState<"Emircan" | "Efsun" | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data: scoresData } = await supabase.from('game_scores').select('*').eq('game_name', 'isim-sehir');
    if (scoresData) {
      const emircanScores = scoresData.filter(d => d.player_name === 'Emircan').map(d => d.score);
      const efsunScores = scoresData.filter(d => d.player_name === 'Efsun').map(d => d.score);
      // İsim şehirde rekor skorlar yerine "Toplam Skorları" göstermek daha zevkli olabilir!
      setLeaderboard({
        emircan: emircanScores.length ? emircanScores.reduce((a, b) => a + b, 0) : 0,
        efsun: efsunScores.length ? efsunScores.reduce((a, b) => a + b, 0) : 0,
      });
    }
  };

  // Zamanlayıcı
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "playing" && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
        if (timeLeft <= 10) playSound("tick");
      }, 1000);
    } else if (phase === "playing" && timeLeft === 0) {
      finishGame();
    }
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  const startGame = () => {
    if (!selectedPlayer) return;
    playSound("start");
    
    // Rastgele harf seç
    const randomLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    setTargetLetter(randomLetter);
    
    setAnswers({ isim: "", sehir: "", hayvan: "", bitki: "", esya: "" });
    setResults({});
    setScore(0);
    setTimeLeft(60);
    setIsSaved(false);
    setPhase("playing");
  };

  const handleInputChange = (categoryId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [categoryId]: value }));
  };

  const finishGame = () => {
    playSound("over");
    
    // Puanlama Algoritması
    let totalScore = 0;
    const currentResults: Record<string, { word: string, points: number }> = {};
    
    CATEGORIES.forEach(cat => {
      const word = answers[cat.id].trim().toLocaleUpperCase('tr-TR');
      let points = 0;
      
      // Kelime boş değilse ve hedef harfle başlıyorsa 10 puan!
      if (word.length > 1 && word.startsWith(targetLetter)) {
        points = 10;
        totalScore += 10;
      }
      
      currentResults[cat.id] = { word: answers[cat.id], points };
    });

    setResults(currentResults);
    setScore(totalScore);
    setPhase("finalResult");
  };

  const saveScoreToDatabase = async () => {
    if (!selectedPlayer || isSaved) return;
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'isim-sehir',
      player_name: selectedPlayer,
      score: score
    }]);
    setIsSaved(true);
    fetchLeaderboard(); 
  };

  return (
    <main className="p-5 animate-in fade-in duration-500 pb-24 min-h-screen flex flex-col relative overflow-hidden">
      
      {/* ÜST MENÜ */}
      <div className="flex items-center mb-4 z-10">
        <Link href="/games" onClick={() => playSound("click")} className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
          <span>←</span> Oyunlar
        </Link>
      </div>

      {/* --- 1. AYARLAR VE LİDERLİK TABLOSU --- */}
      {phase === "settings" && (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-5 max-w-md mx-auto w-full z-10">
          <div className="text-center mb-2">
            <div className="text-6xl mb-2 drop-shadow-lg">🌍</div>
            <h2 className="display-font text-4xl text-primary">İsim Şehir</h2>
            <p className="text-text/70 text-sm mt-2">60 saniyen var. Harfi gör, boşlukları doldur!</p>
          </div>

          {/* LİDERLİK TABLOSU (Toplam Puan) */}
          <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Emircan (Toplam)</span>
              <span className="text-3xl font-black text-primary">{leaderboard.emircan}</span>
            </div>
            <div className="text-2xl opacity-50">⚔️</div>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Efsun (Toplam)</span>
              <span className="text-3xl font-black text-primary">{leaderboard.efsun}</span>
            </div>
          </div>
          
          <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block text-center">Turu Kim Oynuyor?</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedPlayer("Emircan"); playSound("click"); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayer === "Emircan" ? 'bg-primary text-background shadow-md scale-105' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  Emircan
                </button>
                <button 
                  onClick={() => { setSelectedPlayer("Efsun"); playSound("click"); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayer === "Efsun" ? 'bg-primary text-background shadow-md scale-105' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  Efsun
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={startGame} 
            disabled={!selectedPlayer}
            className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg disabled:opacity-50"
          >
            Harfi Çek & Başla 🚀
          </button>
        </div>
      )}

      {/* --- 2. OYUN EKRANI --- */}
      {phase === "playing" && (
        <div className="flex-1 flex flex-col items-center animate-in zoom-in duration-300 w-full max-w-md mx-auto">
          
          {/* Üst Bilgi Çubuğu (Harf ve Süre) */}
          <div className="w-full flex justify-between items-center mb-6">
            <div className="bg-card border border-primary/20 px-6 py-2 rounded-2xl flex items-center shadow-md gap-3">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Harf:</span>
              <span className="text-4xl font-black text-primary drop-shadow-md">{targetLetter}</span>
            </div>
            
            <div className={`px-6 py-3 rounded-2xl font-black text-2xl shadow-xl flex items-center gap-2 transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-primary text-background'}`}>
              ⏱️ {timeLeft}
            </div>
          </div>

          {/* İNPUTLAR */}
          <div className="w-full flex flex-col gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="bg-card border border-primary/20 p-3 rounded-2xl flex flex-col shadow-sm focus-within:border-primary focus-within:shadow-md transition-all">
                <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 pl-2">
                  {cat.label}
                </label>
                <input 
                  type="text" 
                  value={answers[cat.id]}
                  onChange={(e) => handleInputChange(cat.id, e.target.value)}
                  placeholder={`${targetLetter} harfi ile...`}
                  className="w-full bg-background border border-primary/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary/50"
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          <button 
            onClick={finishGame}
            className="w-full mt-6 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg"
          >
            Bitirdim! 🏁
          </button>
        </div>
      )}

      {/* --- 3. OYUN SONU VE KAYDETME --- */}
      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full">
          <div className="text-7xl mb-2 drop-shadow-lg">📜</div>
          <h2 className="display-font text-3xl text-primary mb-1 text-center font-black">Karne Zamanı!</h2>
          <p className="text-text/70 mb-6 text-center text-xs px-4 font-medium uppercase tracking-widest">
            Hedef Harf: <span className="font-bold text-primary text-base">{targetLetter}</span>
          </p>

          {/* CEVAPLAR VE PUANLAR */}
          <div className="w-full flex flex-col gap-2 mb-6">
            {CATEGORIES.map(cat => {
              const res = results[cat.id];
              const isCorrect = res.points > 0;
              return (
                <div key={cat.id} className={`flex justify-between items-center p-3 rounded-xl border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-text/50 font-bold">{cat.label}</span>
                    <span className={`font-bold ${isCorrect ? 'text-green-500' : 'text-red-400 line-through'}`}>
                      {res.word || "Boş"}
                    </span>
                  </div>
                  <span className={`font-black text-xl ${isCorrect ? 'text-green-500' : 'text-red-400'}`}>
                    {isCorrect ? '+10' : '0'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-primary/30 w-full py-4 rounded-[24px] shadow-xl flex justify-between items-center px-8 mb-6">
            <span className="text-sm uppercase tracking-widest text-text/50 font-bold">Toplam Skor</span>
            <span className="display-font text-5xl text-primary font-black drop-shadow-sm">{score}</span>
          </div>

          {!isSaved ? (
             <button 
              onClick={saveScoreToDatabase}
              className="w-full bg-primary text-background py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform text-lg mb-6"
            >
              Skoru {selectedPlayer} Adına Kaydet 💾
            </button>
          ) : (
            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-2xl font-bold text-center mb-6">
              Skor başarıyla kaydedildi! ✅
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => { setPhase("settings"); playSound("click"); }} className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg">
              🔄 Yeni Harf Çek
            </button>
            
            <Link href="/games" onClick={() => playSound("click")} className="w-full bg-card border border-primary/20 text-text/80 p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center flex items-center justify-center gap-2">
              🎮 Oyunlar Menüsü
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}