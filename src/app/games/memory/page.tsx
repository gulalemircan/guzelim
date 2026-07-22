"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio"; 

const calculateStrictScore = (target: {h: number, s: number, l: number}, user: {h: number, s: number, l: number}) => {
  const hueDiff = Math.min(Math.abs(target.h - user.h), 360 - Math.abs(target.h - user.h)) / 180;
  const satDiff = Math.abs(target.s - user.s) / 100;
  const litDiff = Math.abs(target.l - user.l) / 100;

  const totalPenalty = (hueDiff * 2.5 + satDiff + litDiff) / 4.5;
  const score = 100 - (totalPenalty * 150); 
  return Math.max(0, score).toFixed(1);
};

const generateRandomColor = () => ({
  h: Math.floor(Math.random() * 360),
  s: Math.floor(Math.random() * 60) + 40,
  l: Math.floor(Math.random() * 60) + 20 
});

export default function MemoryGamePage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [settings, setSettings] = useState({
    rounds: 3,
    mode: "relaxed" as "timed" | "relaxed",
    timeLimit: 10
  });

  // YENİ: "waitingRoom" (Lobi) fazı eklendi
  const [phase, setPhase] = useState<"modeSelect" | "waitingRoom" | "settings" | "memorize" | "playing" | "roundResult" | "finalResult">("modeSelect");
  const [playMode, setPlayMode] = useState<"single" | "multi" | null>(null);
  
  // YENİ: Lobi durumlarını tutan stateler
  const [opponentJoined, setOpponentJoined] = useState(false);
  const targetOpponent = currentUser === "Emircan" ? "Efsun" : "Emircan";

  const [currentRound, setCurrentRound] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  
  const [targetColor, setTargetColor] = useState(generateRandomColor());
  const [userColor, setUserColor] = useState({ h: 320, s: 50, l: 50 });
  
  const [timeLeft, setTimeLeft] = useState(10);
  const [memorizeTime, setMemorizeTime] = useState(3);
  const [currentScore, setCurrentScore] = useState("0");

  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [selectedPlayer, setSelectedPlayer] = useState<"Emircan" | "Efsun" | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const getAverageScore = () => {
    if (scores.length === 0) return "0";
    const total = scores.reduce((sum, currentScore) => sum + currentScore, 0);
    return (total / scores.length).toFixed(1);
  };

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    fetchLeaderboard();
  }, []);

  // YENİ: Lobi ve Çok Oyunculu Eşleşme Dinleyicisi (Supabase Realtime)
  useEffect(() => {
    if (playMode !== "multi") return;

    const checkLobbyStatus = (data: any) => {
      const amIEmircan = currentUser === "Emircan";
      const myState = amIEmircan ? data.p1_state : data.p2_state;
      const opponentState = amIEmircan ? data.p2_state : data.p1_state;

      // Karşı taraf katılmış mı?
      if (opponentState && opponentState.joined) {
        setOpponentJoined(true);
        // İkimiz de masadaysak ve ben lobi ekranındaysam maça (ayarlara) geçiş yap
        if (myState && myState.joined) {
          setTimeout(() => {
            setPhase((prevPhase) => prevPhase === "waitingRoom" ? "settings" : prevPhase);
            playSound("success");
          }, 1500); // Rakip bulununca 1.5 saniye animasyon izletip maça atar
        }
      } else {
        setOpponentJoined(false);
      }
    };

    const fetchInitialLobby = async () => {
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) checkLobbyStatus(data);
    };

    fetchInitialLobby();

    const channel = supabase
      .channel('lobby-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_state', filter: 'id=eq.1' }, (payload) => {
        checkLobbyStatus(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [playMode, currentUser]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('game_scores').select('*').eq('game_name', 'memory');
    if (data) {
      const emircanScores = data.filter(d => d.player_name === 'Emircan').map(d => d.score);
      const efsunScores = data.filter(d => d.player_name === 'Efsun').map(d => d.score);
      setLeaderboard({
        emircan: emircanScores.length ? Math.max(...emircanScores) : 0,
        efsun: efsunScores.length ? Math.max(...efsunScores) : 0,
      });
    }
  };

  const saveScoreToDatabase = async () => {
    if (!selectedPlayer || isSaved) return;
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'memory',
      player_name: selectedPlayer,
      score: parseFloat(getAverageScore())
    }]);
    setIsSaved(true);
    fetchLeaderboard();
  };

  // YENİ: Masaya (Lobiye) Katılma Fonksiyonu
  const joinMultiplayer = async () => {
    setPlayMode("multi");
    setPhase("waitingRoom");
    playSound("click");

    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    await supabase.from('multiplayer_state').update({
      [playerField]: { joined: true }
    }).eq('id', 1);
  };

  // YENİ: Masadan (Lobiden) Çıkma Fonksiyonu
  const leaveMultiplayer = async () => {
    playSound("click");
    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    await supabase.from('multiplayer_state').update({
      [playerField]: { joined: false }
    }).eq('id', 1);
    
    setPhase("modeSelect");
    setPlayMode(null);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === "memorize") {
      if (memorizeTime > 0) {
        timer = setTimeout(() => {
          setMemorizeTime(m => m - 1);
          playSound("memory_tick");
        }, 1000);
      } else {
        setPhase("playing");
        setTimeLeft(settings.timeLimit); 
        playSound("start");
      }
    } 
    else if (phase === "playing" && settings.mode === "timed") {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          setTimeLeft(t => t - 1);
          if (timeLeft <= 4) playSound("tick");
        }, 1000);
      } else {
        finishRound();
      }
    }

    return () => clearTimeout(timer);
  }, [phase, memorizeTime, timeLeft, settings]);

  const startGame = () => {
    playSound("click");
    setCurrentRound(1);
    setScores([]);
    setSelectedPlayer(null);
    setIsSaved(false);
    startNextRound();
  };

  const startNextRound = () => {
    setTargetColor(generateRandomColor());
    setUserColor({ h: 320, s: 50, l: 50 }); 
    setMemorizeTime(4); 
    setPhase("memorize");
  };

  const finishRound = () => {
    playSound("success");
    const calculatedScore = calculateStrictScore(targetColor, userColor);
    setCurrentScore(calculatedScore);
    setScores(prev => [...prev, parseFloat(calculatedScore)]);
    setPhase("roundResult");
  };

  const handleNext = () => {
    playSound("click");
    if (currentRound < settings.rounds) {
      setCurrentRound(prev => prev + 1);
      startNextRound();
    } else {
      playSound("over");
      setPhase("finalResult");
    }
  };

  // Uygulama kapandığında lobiden düşürmek için
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playMode === "multi") {
         const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
         supabase.from('multiplayer_state').update({ [playerField]: { joined: false } }).eq('id', 1).then();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [playMode, currentUser]);

  return (
    <main className="p-5 animate-in fade-in duration-500 pb-24 min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        .dialed-slider { -webkit-appearance: none; appearance: none; background: transparent; outline: none; margin: 0; }
        .dialed-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%;
          background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.4); cursor: pointer; border: 2px solid #ccc;
        }
      `}} />

      {phase !== "waitingRoom" && (
        <div className="flex items-center mb-4">
          <Link href="/games" onClick={() => playSound("click")} className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
            <span>←</span> Oyunlar
          </Link>
        </div>
      )}

      {phase === "modeSelect" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in slide-in-from-bottom-5 max-w-md mx-auto w-full">
          <div className="text-center mb-2">
            <div className="text-6xl mb-4 drop-shadow-lg">🎮</div>
            <h2 className="display-font text-4xl text-primary font-black">Renk Hafızası</h2>
            <p className="text-text/70 text-sm mt-2 font-medium tracking-wide">Nasıl oynamak istersin?</p>
          </div>

          <div className="w-full flex flex-col gap-4 px-2">
            <button 
              onClick={() => { setPlayMode("single"); setPhase("settings"); playSound("click"); }}
              className="w-full bg-card border-2 border-primary/20 hover:border-primary text-primary p-6 rounded-[32px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center gap-3 group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">👤</span>
              <span className="font-black tracking-widest uppercase text-lg">Tek Oyunculu</span>
              <span className="text-text/50 text-xs font-bold uppercase tracking-wider">Kendi Rekorunu Kır</span>
            </button>

            <button 
              onClick={joinMultiplayer}
              className="w-full bg-primary text-background p-6 rounded-[32px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center gap-3 group border-2 border-transparent relative overflow-hidden"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300 relative z-10">👥</span>
              <span className="font-black tracking-widest uppercase text-lg relative z-10">Çok Oyunculu</span>
              <span className="bg-background/20 text-background px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">
                Aynı Anda Kapış
              </span>
            </button>
          </div>
        </div>
      )}

      {/* YENİ: BEKLEME LOBİSİ (Ortak Masa) */}
      {phase === "waitingRoom" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-md mx-auto w-full text-center">
          
          {!opponentJoined ? (
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center w-32 h-32">
                <div className="absolute w-full h-full border-4 border-primary/30 rounded-full animate-ping"></div>
                <div className="absolute w-24 h-24 bg-primary/20 rounded-full animate-pulse"></div>
                <span className="text-5xl z-10 drop-shadow-xl">📡</span>
              </div>
              <div>
                <h2 className="display-font text-3xl text-primary font-black mb-2">Oda Kuruldu</h2>
                <p className="text-text/70 text-sm font-bold tracking-widest uppercase animate-pulse">
                  {targetOpponent} Bekleniyor...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-5">
              <div className="text-6xl drop-shadow-2xl animate-bounce">⚔️</div>
              <div>
                <h2 className="display-font text-4xl text-primary font-black mb-2 text-green-500">Rakip Bulundu!</h2>
                <p className="text-text/70 text-sm font-bold tracking-widest uppercase">
                  Oyun Ayarlarına Geçiliyor...
                </p>
              </div>
            </div>
          )}

          {!opponentJoined && (
            <button 
              onClick={leaveMultiplayer}
              className="mt-12 text-[10px] bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-2 rounded-full font-bold hover:bg-red-500 hover:text-white transition-colors tracking-widest uppercase shadow-sm"
            >
              Odadan Çık
            </button>
          )}
        </div>
      )}

      {phase === "settings" && (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-5 max-w-md mx-auto w-full">
          <div className="text-center mb-2">
            <div className="text-5xl mb-2">⚙️</div>
            <h2 className="display-font text-3xl text-primary">Oda Ayarları</h2>
            <p className="text-text/70 text-sm font-medium">
              Mod: <span className="text-primary font-bold">{playMode === "single" ? "Tek Oyunculu" : "Çok Oyunculu"}</span>
            </p>
          </div>

          <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Emircan</span>
              <span className="text-2xl font-black text-primary">%{leaderboard.emircan.toFixed(1)}</span>
            </div>
            <div className="text-2xl opacity-50">⚔️</div>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Efsun</span>
              <span className="text-2xl font-black text-primary">%{leaderboard.efsun.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Kaç Tur Oynanacak?</label>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button 
                    key={num}
                    onClick={() => { setSettings({...settings, rounds: num}); playSound("click"); }}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${settings.rounds === num ? 'bg-primary text-background scale-110 shadow-lg' : 'bg-background border border-primary/20 text-text/70 hover:border-primary/50'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Oyun Modu</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setSettings({...settings, mode: "relaxed"}); playSound("click"); }}
                  className={`flex-1 p-3 rounded-xl font-bold text-sm transition-all ${settings.mode === "relaxed" ? 'bg-primary text-background shadow-lg' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  ☕ Rahat Mod
                </button>
                <button 
                  onClick={() => { setSettings({...settings, mode: "timed"}); playSound("click"); }}
                  className={`flex-1 p-3 rounded-xl font-bold text-sm transition-all ${settings.mode === "timed" ? 'bg-primary text-background shadow-lg' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  ⏱️ Süreli Mod
                </button>
              </div>
            </div>

            {settings.mode === "timed" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block text-red-500">Sayaç Süresi (Saniye)</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map(time => (
                    <button 
                      key={time}
                      onClick={() => { setSettings({...settings, timeLimit: time}); playSound("click"); }}
                      className={`flex-1 py-2 rounded-xl font-bold transition-all ${settings.timeLimit === time ? 'bg-red-500 text-white shadow-lg' : 'bg-background border border-red-500/20 text-text/70'}`}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={startGame} className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg">
            Oyunu Başlat 🚀
          </button>
        </div>
      )}

      {(phase === "memorize" || phase === "playing") && (
        <div 
          className="flex-1 w-full rounded-3xl overflow-hidden relative shadow-2xl transition-colors duration-200 border border-black/10"
          style={{ backgroundColor: phase === "memorize" ? `hsl(${targetColor.h}, ${targetColor.s}%, ${targetColor.l}%)` : `hsl(${userColor.h}, ${userColor.s}%, ${userColor.l}%)` }}
        >
          <div className="absolute top-6 left-6 z-10">
            <span className="bg-black/30 backdrop-blur-md text-white text-xs font-bold tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
              TUR {currentRound} / {settings.rounds}
            </span>
          </div>

          {settings.mode === "timed" && phase === "playing" && (
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full font-black text-2xl shadow-xl flex items-center gap-2 transition-colors duration-300 ${timeLeft <= 3 ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-black/60 backdrop-blur-md text-white'}`}>
              ⏱️ {timeLeft}
            </div>
          )}

          {phase === "memorize" && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-9xl font-black drop-shadow-2xl animate-in zoom-in duration-300">
              {memorizeTime > 0 ? memorizeTime : ""}
            </div>
          )}

          {phase === "playing" && (
            <>
              <div className="absolute top-0 left-0 h-full flex w-32 bg-black/20 backdrop-blur-[4px] border-r border-white/10">
                <div className="flex-1 h-full relative overflow-hidden">
                  <input type="range" min="0" max="360" value={userColor.h} 
                    onChange={(e) => { setUserColor({...userColor, h: parseInt(e.target.value)}); playSound("memory_dial"); }} 
                    className="dialed-slider absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 w-[500px] h-full"
                    style={{ background: `linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)` }} />
                </div>
                <div className="flex-1 h-full relative overflow-hidden">
                  <input type="range" min="0" max="100" value={userColor.s} 
                    onChange={(e) => { setUserColor({...userColor, s: parseInt(e.target.value)}); playSound("memory_dial"); }} 
                    className="dialed-slider absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 w-[500px] h-full"
                    style={{ background: `linear-gradient(to right, hsl(${userColor.h}, 0%, ${userColor.l}%), hsl(${userColor.h}, 100%, ${userColor.l}%))` }} />
                </div>
                <div className="flex-1 h-full relative overflow-hidden">
                  <input type="range" min="0" max="100" value={userColor.l} 
                    onChange={(e) => { setUserColor({...userColor, l: parseInt(e.target.value)}); playSound("memory_dial"); }} 
                    className="dialed-slider absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 w-[500px] h-full"
                    style={{ background: `linear-gradient(to right, #000000, hsl(${userColor.h}, ${userColor.s}%, 50%), #ffffff)` }} />
                </div>
              </div>

              <button onClick={finishRound} className="absolute bottom-6 right-6 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-transform z-10 border-4 border-black/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {phase === "roundResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in slide-in-from-bottom-5">
          <div className="text-xs uppercase tracking-widest text-primary font-bold mb-4 border border-primary/20 px-4 py-1 rounded-full bg-card shadow-sm">
            Tur {currentRound} Sonucu
          </div>
          <h2 className="display-font text-6xl text-primary mb-2 font-black drop-shadow-sm">%{currentScore}</h2>
          <p className="text-text/70 mb-10 font-medium tracking-widest uppercase text-sm">Benzerlik</p>

          <div className="flex w-full max-w-sm rounded-3xl overflow-hidden h-40 shadow-2xl border border-white/10 mb-10 relative">
            <div className="flex-1 flex items-end p-3" style={{ backgroundColor: `hsl(${targetColor.h}, ${targetColor.s}%, ${targetColor.l}%)` }}>
              <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md shadow-sm">Gerçek Renk</span>
            </div>
            <div className="flex-1 flex items-end p-3" style={{ backgroundColor: `hsl(${userColor.h}, ${userColor.s}%, ${userColor.l}%)` }}>
              <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md shadow-sm">Tahminin</span>
            </div>
          </div>

          <button onClick={handleNext} className="w-full max-w-xs bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg">
            {currentRound < settings.rounds ? "Sonraki Tur ➡️" : "Sonuçları Gör 🏆"}
          </button>
        </div>
      )}

      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full">
          <div className="text-7xl mb-4 drop-shadow-lg">👑</div>
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">Maç Bitti!</h2>
          <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
            Toplam {settings.rounds} tur oynadınız. Genel isabet oranınız:
          </p>

          <div className="bg-card border border-primary/30 w-full p-8 rounded-[32px] shadow-2xl flex flex-col items-center mb-6">
            <h3 className="display-font text-6xl text-primary font-black drop-shadow-sm">%{getAverageScore()}</h3>
            <span className="text-xs uppercase tracking-widest text-text/50 mt-3 font-bold">Ortalama Başarı</span>
          </div>

          {!isSaved ? (
            <div className="w-full bg-card border border-primary/20 p-5 rounded-2xl shadow-md mb-6">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block text-center">Bu Skoru Kim Kaydediyor?</label>
              <div className="flex gap-2 mb-3">
                <button 
                  onClick={() => { playSound("click"); setSelectedPlayer("Emircan"); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayer === "Emircan" ? 'bg-primary text-background shadow-md scale-105' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  Emircan
                </button>
                <button 
                  onClick={() => { playSound("click"); setSelectedPlayer("Efsun"); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayer === "Efsun" ? 'bg-primary text-background shadow-md scale-105' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  Efsun
                </button>
              </div>
              <button 
                onClick={saveScoreToDatabase}
                disabled={!selectedPlayer}
                className="w-full bg-primary text-background py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                Skoru Kaydet 💾
              </button>
            </div>
          ) : (
            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-2xl font-bold text-center mb-6">
              Skor başarıyla kaydedildi! ✅
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={() => { 
                setPhase("modeSelect"); 
                setPlayMode(null); 
                playSound("click"); 
              }} 
              className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg"
            >
              🔄 Ana Menüye Dön
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