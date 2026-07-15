"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

// İlk kurulum için varsayılan kelimeler (Veritabanı boşsa otomatik eklenecek)
const INITIAL_CARDS = [
  { word: "AŞK", forbidden: ["Sevgi", "Sevgili", "Kalp", "Duygu", "Hissetmek"] },
  { word: "EVLİLİK", forbidden: ["Düğün", "Gelin", "Damat", "Yüzük", "İmza"] },
  { word: "PARİS", forbidden: ["Fransa", "Eyfel", "Şehir", "Başkent", "Romantik"] },
  { word: "SİNEMA", forbidden: ["Film", "Patlamış Mısır", "İzlemek", "Bilet", "Perde"] },
  { word: "KAHVE", forbidden: ["Çay", "İçmek", "Kafein", "Fincan", "Sabah"] },
  { word: "TATİL", forbidden: ["Deniz", "Kum", "Güneş", "Otel", "Yaz"] },
  { word: "HEDİYE", forbidden: ["Paket", "Sürpriz", "Doğum Günü", "Vermek", "Kutu"] },
  { word: "SARILMAK", forbidden: ["Kollar", "Sıcak", "Özlem", "Sevgi", "Dokunmak"] },
  { word: "KISKANÇLIK", forbidden: ["Kötü", "Duygu", "Sevgili", "Şüphe", "Güven"] },
  { word: "ŞARAP", forbidden: ["İçki", "Kırmızı", "Beyaz", "Kadeh", "Üzüm"] },
  { word: "KAMP", forbidden: ["Çadır", "Ateş", "Orman", "Doğa", "Uyku Tulumu"] },
  { word: "YIL DÖNÜMÜ", forbidden: ["Kutlama", "Tarih", "Sevgili", "Hatırlamak", "Hediye"] },
  { word: "KİTAP", forbidden: ["Okumak", "Sayfa", "Yazar", "Kelimeler", "Kapak"] },
  { word: "MÜZİK", forbidden: ["Şarkı", "Dinlemek", "Ses", "Kulaklık", "Ritim"] },
  { word: "FOTOĞRAF", forbidden: ["Çekmek", "Kamera", "Anı", "Gülümse", "Poz"] }
];

export default function TabooPage() {
  const [phase, setPhase] = useState<"settings" | "playing" | "finalResult">("settings");
  
  // Oyun Ayarları ve Veriler
  const [allCards, setAllCards] = useState<any[]>([]);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase Skorları
  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [selectedPlayer, setSelectedPlayer] = useState<"Emircan" | "Efsun" | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // 1. Liderlik Tablosunu Çek
    const { data: scoresData } = await supabase.from('game_scores').select('*').eq('game_name', 'taboo');
    if (scoresData) {
      const emircanScores = scoresData.filter(d => d.player_name === 'Emircan').map(d => d.score);
      const efsunScores = scoresData.filter(d => d.player_name === 'Efsun').map(d => d.score);
      setLeaderboard({
        emircan: emircanScores.length ? Math.max(...emircanScores) : 0,
        efsun: efsunScores.length ? Math.max(...efsunScores) : 0,
      });
    }

    // 2. Tabu Kelimelerini Çek
    const { data: cardsData } = await supabase.from('taboo_cards').select('*');
    
    if (cardsData && cardsData.length > 0) {
      setAllCards(cardsData);
    } else {
      // Eğer tablo boşsa (ilk defa giriliyorsa), varsayılan kelimeleri Supabase'e kaydet
      await supabase.from('taboo_cards').insert(INITIAL_CARDS);
      setAllCards(INITIAL_CARDS);
    }
    setIsLoading(false);
  };

  // Zamanlayıcı
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "playing" && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
        if (timeLeft <= 5) playSound("tick");
      }, 1000);
    } else if (phase === "playing" && timeLeft === 0) {
      playSound("over");
      setPhase("finalResult");
    }
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  const startGame = () => {
    if (!selectedPlayer || allCards.length === 0) return;
    playSound("start");
    // Kelimeleri karıştır
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentCardIndex(0);
    setScore(0);
    setTimeLeft(timeLimit);
    setIsSaved(false);
    setPhase("playing");
  };

  const nextCard = () => {
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Kelimeler biterse başa dön ve tekrar karıştır
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      setShuffledCards(shuffled);
      setCurrentCardIndex(0);
    }
  };

  const handleCorrect = () => {
    playSound("success");
    setScore(s => s + 1);
    nextCard();
  };

  const handleTaboo = () => {
    playSound("click");
    setScore(s => s - 1);
    nextCard();
  };

  const handlePass = () => {
    playSound("click");
    nextCard();
  };

  const saveScoreToDatabase = async () => {
    if (!selectedPlayer || isSaved) return;
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'taboo',
      player_name: selectedPlayer,
      score: score
    }]);
    setIsSaved(true);
    fetchData(); // Skorları hemen güncelle
  };

  const currentCard = shuffledCards[currentCardIndex];

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-bold animate-pulse">Veritabanı Yükleniyor...</div>;
  }

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
            <div className="text-6xl mb-2 drop-shadow-lg">🗣️</div>
            <h2 className="display-font text-4xl text-primary">Tabu</h2>
            <p className="text-text/70 text-sm mt-2">Yasaklı kelimeleri kullanmadan anlat bakalım!</p>
            <p className="text-primary/60 text-xs mt-1 font-bold">Veritabanında {allCards.length} kelime var.</p>
          </div>

          {/* LİDERLİK TABLOSU */}
          <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Emircan (Rekor)</span>
              <span className="text-3xl font-black text-primary">{leaderboard.emircan}</span>
            </div>
            <div className="text-2xl opacity-50">⚔️</div>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Efsun (Rekor)</span>
              <span className="text-3xl font-black text-primary">{leaderboard.efsun}</span>
            </div>
          </div>
          
          <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            
            {/* Süre Seçimi */}
            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Süre Seçimi</label>
              <div className="flex gap-2">
                {[60, 90, 120].map(time => (
                  <button 
                    key={time}
                    onClick={() => { setTimeLimit(time); playSound("click"); }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${timeLimit === time ? 'bg-primary text-background scale-105 shadow-md' : 'bg-background border border-primary/20 text-text/70 hover:border-primary/50'}`}
                  >
                    {time}s
                  </button>
                ))}
              </div>
            </div>

            {/* Oyuncu Seçimi */}
            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Şu An Kim Anlatıyor?</label>
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
            disabled={!selectedPlayer || allCards.length === 0}
            className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg disabled:opacity-50"
          >
            Süreyi Başlat 🚀
          </button>
        </div>
      )}

      {/* --- 2. OYUN EKRANI --- */}
      {phase === "playing" && currentCard && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300 w-full max-w-md mx-auto">
          
          {/* Üst Bilgi Çubuğu (Süre ve Skor) */}
          <div className="w-full flex justify-between items-center mb-6 px-2">
            <div className="bg-card border border-primary/20 px-4 py-2 rounded-2xl flex flex-col items-center shadow-md">
              <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold">Skor</span>
              <span className="text-2xl font-black text-primary">{score}</span>
            </div>
            
            <div className={`px-6 py-2 rounded-full font-black text-3xl shadow-xl flex items-center gap-2 transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-primary text-background'}`}>
              ⏱️ {timeLeft}
            </div>
          </div>

          {/* TABU KARTI */}
          <div className="bg-card w-full rounded-[40px] shadow-2xl border-2 border-primary/30 flex flex-col items-center overflow-hidden mb-8 relative">
            
            {/* Kart Üst (Anlatılacak Kelime) */}
            <div className="w-full bg-primary/10 py-10 flex items-center justify-center border-b-2 border-primary/20">
              <h2 className="display-font text-5xl text-primary font-black tracking-wider text-center px-4">
                {currentCard.word}
              </h2>
            </div>

            {/* Yasaklı Kelimeler */}
            <div className="w-full py-8 px-6 flex flex-col gap-4 bg-card relative">
              <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center text-9xl">🚫</div>
              {currentCard.forbidden.map((word: string, index: number) => (
                <div key={index} className="w-full bg-background border border-red-500/20 py-3 rounded-xl flex items-center justify-center">
                  <span className="text-red-400 font-bold tracking-widest uppercase text-lg">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BUTONLAR (Tabu, Pas, Doğru) */}
          <div className="flex w-full gap-3 px-2">
            <button onClick={handleTaboo} className="flex-1 bg-red-500/10 border-2 border-red-500 text-red-500 py-4 rounded-2xl font-black text-lg hover:bg-red-500 hover:text-white transition-colors flex flex-col items-center justify-center shadow-lg active:scale-95">
              <span>TABU</span>
              <span className="text-xs opacity-80">-1 Puan</span>
            </button>
            <button onClick={handlePass} className="flex-1 bg-background border-2 border-primary/30 text-text/70 py-4 rounded-2xl font-black text-lg hover:border-primary/60 transition-colors flex flex-col items-center justify-center shadow-lg active:scale-95">
              <span>PAS</span>
              <span className="text-xs opacity-80">0 Puan</span>
            </button>
            <button onClick={handleCorrect} className="flex-1 bg-green-500/10 border-2 border-green-500 text-green-500 py-4 rounded-2xl font-black text-lg hover:bg-green-500 hover:text-white transition-colors flex flex-col items-center justify-center shadow-lg active:scale-95">
              <span>DOĞRU</span>
              <span className="text-xs opacity-80">+1 Puan</span>
            </button>
          </div>
        </div>
      )}

      {/* --- 3. OYUN SONU VE KAYDETME --- */}
      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full">
          <div className="text-7xl mb-4 drop-shadow-lg">⏳</div>
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">Süre Doldu!</h2>
          <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
            {selectedPlayer}, bu turdaki toplam net skorun:
          </p>

          <div className="bg-card border border-primary/30 w-full p-8 rounded-[32px] shadow-2xl flex flex-col items-center mb-6">
            <h3 className="display-font text-7xl text-primary font-black drop-shadow-sm">{score}</h3>
            <span className="text-xs uppercase tracking-widest text-text/50 mt-3 font-bold">Toplam Puan</span>
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
              🔄 Başka Bir Tur Oyna
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