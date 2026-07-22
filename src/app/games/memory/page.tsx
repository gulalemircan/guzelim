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

  const [phase, setPhase] = useState<"modeSelect" | "settings" | "memorize" | "playing" | "waitingRound" | "roundResult" | "finalResult">("modeSelect");
  const [playMode, setPlayMode] = useState<"single" | "multi" | null>(null);
  
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isMeReady, setIsMeReady] = useState(false);
  const targetOpponent = currentUser === "Emircan" ? "Efsun" : "Emircan";

  const [currentRound, setCurrentRound] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  
  const [targetColor, setTargetColor] = useState(generateRandomColor());
  const [userColor, setUserColor] = useState({ h: 320, s: 50, l: 50 });
  
  const [timeLeft, setTimeLeft] = useState(10);
  const [memorizeTime, setMemorizeTime] = useState(3);
  
  const [currentScore, setCurrentScore] = useState("0");
  const [opponentCurrentScore, setOpponentCurrentScore] = useState("0");
  
  // YENİ: Maç sonu hesaplamaları için stateler
  const [myFinalScore, setMyFinalScore] = useState<string | null>(null);
  const [opponentFinalScore, setOpponentFinalScore] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [winSaved, setWinSaved] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (phase !== "modeSelect" && phase !== "settings" && phase !== "finalResult") {
      document.body.classList.add("game-active-ui");
    } else {
      document.body.classList.remove("game-active-ui");
    }
    return () => document.body.classList.remove("game-active-ui");
  }, [phase]);

  // YENİ: Lobideki Skor Tablosunu "Kazanma Sayısı" (Win Count) olarak çekme
  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('game_scores').select('*').eq('game_name', 'memory_win');
    if (data) {
      const emircanWins = data.filter(d => d.player_name === 'Emircan').length;
      const efsunWins = data.filter(d => d.player_name === 'Efsun').length;
      setLeaderboard({ emircan: emircanWins, efsun: efsunWins });
    }
  };

  // YENİ: Kimin kazandığını hesaplayıp otomatik kaydetme
  useEffect(() => {
    if (phase === "finalResult" && !isSaved && myFinalScore) {
      // Önce normal puanı veri tabanına geçmiş olarak kaydet
      supabase.from('game_scores').insert([{
        game_name: 'memory',
        player_name: currentUser,
        score: parseFloat(myFinalScore)
      }]).then(() => setIsSaved(true));

      // Eğer çok oyunculuysa ve KAZANAN BEN İSEM, haneme 1 Galibiyet (win) yaz!
      if (playMode === "multi" && opponentFinalScore !== null && !winSaved) {
        if (parseFloat(myFinalScore) > parseFloat(opponentFinalScore)) {
          supabase.from('game_scores').insert([{
            game_name: 'memory_win',
            player_name: currentUser,
            score: 1
          }]).then(() => {
            setWinSaved(true);
            fetchLeaderboard(); // Galibiyet sonrası lobi skorunu güncelle
          });
        } else {
          // Eğer kaybettiysem veya berabereyse rakibin kazanma yazmasını bekleyip kendi lobimi güncelliyorum
          setTimeout(fetchLeaderboard, 2000);
          setWinSaved(true);
        }
      }
    }
  }, [phase, isSaved, winSaved, myFinalScore, opponentFinalScore, playMode, currentUser]);

  useEffect(() => {
    if (playMode !== "multi") return;

    const checkLobbyStatus = (data: any) => {
      const amIEmircan = currentUser === "Emircan";
      const myState = amIEmircan ? data.p1_state : data.p2_state;
      const opState = amIEmircan ? data.p2_state : data.p1_state;

      if (opState?.ready) setIsOpponentReady(true);
      else setIsOpponentReady(false);

      if (opState?.currentScore) setOpponentCurrentScore(opState.currentScore);
      if (opState?.finalScore) setOpponentFinalScore(opState.finalScore);

      if (data.status === 'playing') {
        if (phase === "settings") {
          setSettings(data.shared_data.settings);
          setCurrentRound(1);
          setScores([]); 
          setMyFinalScore(null);
          setOpponentFinalScore(null);
          setIsSaved(false);
          setWinSaved(false);
          setTargetColor(data.shared_data.targetColor);
          setUserColor({ h: 320, s: 50, l: 50 });
          setMemorizeTime(4);
          setPhase("memorize");
          playSound("start");
        } 
        else if (data.shared_data?.round > currentRound) {
          setCurrentRound(data.shared_data.round);
          setTargetColor(data.shared_data.targetColor);
          setUserColor({ h: 320, s: 50, l: 50 });
          setMemorizeTime(4);
          setPhase("memorize");
        }
      }

      if (data.status === 'playing' && myState?.roundFinished && opState?.roundFinished) {
        if (phase !== 'roundResult' && phase !== 'finalResult') {
          setPhase('roundResult');
          playSound("success");
        }
      }

      if (data.status === 'game_over' && phase !== 'finalResult') {
        setPhase('finalResult');
        playSound("over");
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
  }, [playMode, currentUser, phase, currentRound]);

  const joinMultiplayer = async () => {
    setPlayMode("multi");
    setPhase("settings");
    setIsMeReady(false);
    playSound("click");
    fetchLeaderboard();

    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    const updateData: any = { [playerField]: { joined: true, ready: false, roundFinished: false } };
    if (currentUser === "Emircan") updateData.status = 'waiting';
    await supabase.from('multiplayer_state').update(updateData).eq('id', 1);
  };

  const returnToMenu = async () => {
    playSound("click");
    if (playMode === "multi") {
      const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
      await supabase.from('multiplayer_state').update({ [playerField]: { joined: false, ready: false } }).eq('id', 1);
    }
    setPhase("modeSelect");
    setPlayMode(null);
    setIsMeReady(false);
    setScores([]);
    setIsSaved(false);
    setWinSaved(false);
  };

  const returnToLobby = async () => {
    playSound("click");
    setPhase("settings");
    setIsMeReady(false);
    setScores([]);
    setMyFinalScore(null);
    setOpponentFinalScore(null);
    setIsSaved(false);
    setWinSaved(false);
    fetchLeaderboard();
    
    if (playMode === "multi") {
      const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
      const updateData: any = { [playerField]: { joined: true, ready: false, roundFinished: false } };
      if (currentUser === "Emircan") updateData.status = 'waiting';
      await supabase.from('multiplayer_state').update(updateData).eq('id', 1);
    }
  };

  const toggleReady = async () => {
    playSound("click");
    const newReadyState = !isMeReady;
    setIsMeReady(newReadyState);
    
    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    await supabase.from('multiplayer_state').update({
      [playerField]: { joined: true, ready: newReadyState, roundFinished: false }
    }).eq('id', 1);
  };

  const startMultiplayerGame = async () => {
    playSound("click");
    const initialColor = generateRandomColor(); 
    await supabase.from('multiplayer_state').update({
      status: 'playing',
      shared_data: { settings: settings, targetColor: initialColor, round: 1 },
      p1_state: { joined: true, ready: true, roundFinished: false, currentScore: "0", finalScore: null },
      p2_state: { joined: true, ready: true, roundFinished: false, currentScore: "0", finalScore: null }
    }).eq('id', 1);
  };

  const startSinglePlayerGame = () => {
    playSound("click");
    setCurrentRound(1);
    setScores([]);
    setIsSaved(false);
    setWinSaved(false);
    setMyFinalScore(null);
    
    setTargetColor(generateRandomColor());
    setUserColor({ h: 320, s: 50, l: 50 }); 
    setMemorizeTime(4); 
    setPhase("memorize");
  };

  const finishRound = async () => {
    playSound("success");
    const calculatedScore = calculateStrictScore(targetColor, userColor);
    setCurrentScore(calculatedScore);
    
    const newScores = [...scores, parseFloat(calculatedScore)];
    setScores(newScores);
    
    if (playMode === "multi") {
      setPhase("waitingRound");
      const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
      
      let finalAvg = null;
      if (currentRound >= settings.rounds) {
        const total = newScores.reduce((sum, val) => sum + val, 0);
        finalAvg = (total / newScores.length).toFixed(1);
        setMyFinalScore(finalAvg);
      }

      await supabase.from('multiplayer_state').update({
        [playerField]: { 
          joined: true, 
          ready: true, 
          roundFinished: true, 
          currentScore: calculatedScore,
          finalScore: finalAvg
        }
      }).eq('id', 1);
    } else {
      setPhase("roundResult");
    }
  };

  const handleNext = async () => {
    playSound("click");
    if (currentRound < settings.rounds) {
      if (playMode === "multi" && currentUser === "Emircan") {
         const nextTarget = generateRandomColor();
         await supabase.from('multiplayer_state').update({
            shared_data: { settings, targetColor: nextTarget, round: currentRound + 1 },
            p1_state: { joined: true, ready: true, roundFinished: false, currentScore: "0" },
            p2_state: { joined: true, ready: true, roundFinished: false, currentScore: "0" }
         }).eq('id', 1);
      } else if (playMode === "single") {
         setCurrentRound(prev => prev + 1);
         setTargetColor(generateRandomColor());
         setUserColor({ h: 320, s: 50, l: 50 });
         setMemorizeTime(4);
         setPhase("memorize");
      }
    } else {
      if (playMode === "multi" && currentUser === "Emircan") {
         await supabase.from('multiplayer_state').update({ status: 'game_over' }).eq('id', 1);
      } else if (playMode === "single") {
         const total = scores.reduce((sum, val) => sum + val, 0);
         setMyFinalScore((total / scores.length).toFixed(1));
         playSound("over");
         setPhase("finalResult");
      }
    }
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playMode === "multi") {
         const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
         supabase.from('multiplayer_state').update({ [playerField]: { joined: false, ready: false } }).eq('id', 1).then();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [playMode, currentUser]);

  return (
    <main className="p-5 animate-in fade-in duration-500 pb-24 min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        .dialed-slider { 
          -webkit-appearance: none; appearance: none; background: transparent; outline: none; margin: 0; 
          touch-action: none; 
        }
        .dialed-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%;
          background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.4); cursor: pointer; border: 2px solid #ccc;
        }
        .game-active-ui div[class*="fixed"][class*="bottom-"] {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: all 0.3s ease;
        }
      `}} />

      {phase === "modeSelect" || phase === "settings" || phase === "finalResult" ? (
        <div className="flex items-center mb-4">
          <Link href="/games" onClick={() => playSound("click")} className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
            <span>←</span> Oyunlar
          </Link>
        </div>
      ) : null}

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

      {phase === "settings" && (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-5 max-w-md mx-auto w-full">
          
          <div className="text-center mb-2">
            <div className="text-5xl mb-2">⚙️</div>
            <h2 className="display-font text-3xl text-primary">
              {playMode === "multi" && currentUser === "Efsun" ? "Bekleme Odası" : "Oda Ayarları"}
            </h2>
            <p className="text-text/70 text-sm font-medium">
              Mod: <span className="text-primary font-bold">{playMode === "single" ? "Tek Oyunculu" : "Çok Oyunculu"}</span>
            </p>
          </div>

          {/* YENİ LOBİ SKOR TABLOSU: Yüzde yerine WIN (Galibiyet) sayısını gösterir */}
          <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Emircan</span>
              <span className="text-3xl font-black text-primary">{leaderboard.emircan}</span>
            </div>
            <div className="text-2xl opacity-50 flex flex-col items-center gap-1">
               <span className="text-[8px] uppercase tracking-widest font-bold">GALİBİYET</span>
               ⚔️
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Efsun</span>
              <span className="text-3xl font-black text-primary">{leaderboard.efsun}</span>
            </div>
          </div>
          
          {playMode === "multi" && currentUser === "Efsun" ? (
            <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-bounce">⏳</div>
                <h3 className="display-font text-2xl text-primary mb-2">Kurallar Belirleniyor</h3>
                <p className="text-text/60 text-xs font-bold tracking-widest uppercase">
                  Emircan oyun ayarlarını seçiyor...
                </p>
              </div>

              <button 
                onClick={toggleReady}
                className={`w-full py-5 rounded-[24px] font-black text-xl tracking-widest uppercase shadow-2xl transition-all duration-300 ${
                  isMeReady 
                    ? 'bg-green-500 text-white hover:bg-green-600 scale-[1.02] border-4 border-green-400/50' 
                    : 'bg-card border-4 border-primary text-primary hover:bg-primary hover:text-background'
                }`}
              >
                {isMeReady ? "👍 HAZIRSIN" : "HAZIRIM"}
              </button>

              {isMeReady && (
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest animate-pulse mt-[-10px]">
                  Emircan'ın başlatması bekleniyor...
                </p>
              )}
            </div>
          ) : (
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
          )}

          {playMode === "multi" && currentUser === "Emircan" ? (
            <button 
              onClick={startMultiplayerGame}
              disabled={!isOpponentReady}
              className={`w-full mt-2 p-5 rounded-2xl shadow-xl transition-all duration-300 font-black text-lg tracking-widest uppercase ${
                isOpponentReady 
                  ? 'bg-primary text-background hover:scale-[1.02] ring-4 ring-primary/30' 
                  : 'bg-background border-2 border-primary/20 text-primary/40 cursor-not-allowed'
              }`}
            >
              {isOpponentReady ? "OYUNU BAŞLAT 🚀" : "EFSUN'UN HAZIR OLMASI BEKLENİYOR..."}
            </button>
          ) : playMode === "single" && (
            <button 
              onClick={startSinglePlayerGame} 
              className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg"
            >
              Oyunu Başlat 🚀
            </button>
          )}

          {playMode === "multi" && (
             <button onClick={returnToMenu} className="text-[10px] text-red-500 uppercase tracking-widest font-bold mt-2 hover:underline text-center w-full">
               Odadan Çık
             </button>
          )}
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
              {/* YENİ: onChange'den playSound çıkarıldı, sadece state güncelleniyor (kasma bitti). */}
              {/* onPointerUp eklenerek sadece parmak ekrandan çekildiğinde ufak bir tık sesi verildi. */}
              <div className="absolute top-0 left-0 h-full flex w-32 bg-black/20 backdrop-blur-[4px] border-r border-white/10">
                <div className="flex-1 h-full relative overflow-hidden">
                  <input type="range" min="0" max="360" value={userColor.h} 
                    onChange={(e) => { setUserColor({...userColor, h: parseInt(e.target.value)}); }}
                    onPointerUp={() => playSound("click")}
                    className="dialed-slider absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 w-[500px] h-full"
                    style={{ background: `linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)` }} />
                </div>
                <div className="flex-1 h-full relative overflow-hidden">
                  <input type="range" min="0" max="100" value={userColor.s} 
                    onChange={(e) => { setUserColor({...userColor, s: parseInt(e.target.value)}); }}
                    onPointerUp={() => playSound("click")}
                    className="dialed-slider absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 w-[500px] h-full"
                    style={{ background: `linear-gradient(to right, hsl(${userColor.h}, 0%, ${userColor.l}%), hsl(${userColor.h}, 100%, ${userColor.l}%))` }} />
                </div>
                <div className="flex-1 h-full relative overflow-hidden">
                  <input type="range" min="0" max="100" value={userColor.l} 
                    onChange={(e) => { setUserColor({...userColor, l: parseInt(e.target.value)}); }}
                    onPointerUp={() => playSound("click")}
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

      {phase === "waitingRound" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full">
          <div className="text-6xl mb-6 animate-spin drop-shadow-xl">⏳</div>
          <h2 className="display-font text-3xl text-primary mb-2 text-center">Sonuç Hesaplanıyor...</h2>
          <p className="text-text/70 uppercase tracking-widest text-sm font-bold animate-pulse text-center">
             {targetOpponent}'un Seçimi Bekleniyor
          </p>
        </div>
      )}

      {phase === "roundResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in slide-in-from-bottom-5 w-full">
          <div className="text-xs uppercase tracking-widest text-primary font-bold mb-4 border border-primary/20 px-4 py-1 rounded-full bg-card shadow-sm">
            Tur {currentRound} Sonucu
          </div>
          
          <h2 className="display-font text-6xl text-primary mb-1 font-black drop-shadow-sm">%{currentScore}</h2>
          <p className="text-text/70 mb-4 font-medium tracking-widest uppercase text-xs">Senin Puanın</p>

          {playMode === "multi" && (
            <div className="mb-8 bg-card border border-primary/20 px-6 py-2 rounded-2xl flex flex-col items-center shadow-lg">
              <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold mb-1">{targetOpponent}'un Puanı</span>
              <span className="text-3xl font-black text-primary/80">%{opponentCurrentScore}</span>
            </div>
          )}

          <div className="flex w-full max-w-sm rounded-3xl overflow-hidden h-32 shadow-2xl border border-white/10 mb-10 relative">
            <div className="flex-1 flex items-end p-3" style={{ backgroundColor: `hsl(${targetColor.h}, ${targetColor.s}%, ${targetColor.l}%)` }}>
              <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md shadow-sm">Gerçek</span>
            </div>
            <div className="flex-1 flex items-end p-3" style={{ backgroundColor: `hsl(${userColor.h}, ${userColor.s}%, ${userColor.l}%)` }}>
              <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md shadow-sm">Tahminin</span>
            </div>
          </div>

          {playMode === "single" || currentUser === "Emircan" ? (
            <button onClick={handleNext} className="w-full max-w-xs bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg">
              {currentRound < settings.rounds ? "Sonraki Tur ➡️" : "Sonuçları Gör 🏆"}
            </button>
          ) : (
            <div className="w-full max-w-xs p-4 rounded-2xl border border-primary/20 bg-card text-center text-xs font-bold uppercase tracking-widest text-primary/70 animate-pulse">
              Emircan'ın Sonraki Tura Geçmesi Bekleniyor...
            </div>
          )}
        </div>
      )}

      {/* YENİ: KAZANAN EKRANI VE ORTALAMALAR */}
      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full">
          <div className="text-7xl mb-4 drop-shadow-lg">👑</div>
          
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">
            {playMode === "single" ? "Maç Bitti!" :
              opponentFinalScore === null ? "Sonuçlar Hesaplanıyor..." :
              parseFloat(myFinalScore || "0") > parseFloat(opponentFinalScore) ? "Kazanan Sen Oldun! 🏆" :
              parseFloat(myFinalScore || "0") < parseFloat(opponentFinalScore) ? `Kazanan ${targetOpponent}! 😔` :
              "Berabere! 🤝"
            }
          </h2>
          
          <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
            Toplam {settings.rounds} turun genel ortalaması hesaplandı.
          </p>

          {/* İki tarafın da tüm turlardaki ortalamasını yan yana gösterir */}
          {playMode === "multi" && opponentFinalScore !== null ? (
            <div className="flex gap-4 w-full justify-center mb-6">
              <div className={`bg-card border ${parseFloat(myFinalScore || "0") >= parseFloat(opponentFinalScore) ? 'border-green-500 shadow-green-500/20' : 'border-primary/20'} w-1/2 p-4 rounded-3xl shadow-xl flex flex-col items-center relative`}>
                <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-2">Sen</span>
                <h3 className="display-font text-4xl text-primary font-black">%{myFinalScore}</h3>
              </div>
              
              <div className={`bg-card border ${parseFloat(opponentFinalScore) >= parseFloat(myFinalScore || "0") ? 'border-green-500 shadow-green-500/20' : 'border-primary/20'} w-1/2 p-4 rounded-3xl shadow-xl flex flex-col items-center relative`}>
                <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-2">{targetOpponent}</span>
                <h3 className="display-font text-4xl text-primary font-black">%{opponentFinalScore}</h3>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-primary/30 w-full p-8 rounded-[32px] shadow-2xl flex flex-col items-center mb-6">
              <h3 className="display-font text-6xl text-primary font-black drop-shadow-sm">%{myFinalScore}</h3>
              <span className="text-xs uppercase tracking-widest text-text/50 mt-3 font-bold">Genel Ortalaman</span>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full mt-4">
            <button 
              onClick={returnToLobby} 
              className="w-full bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg"
            >
              🔄 Tekrar Oyna (Lobiye Dön)
            </button>
            
            <button 
              onClick={returnToMenu} 
              className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center"
            >
              ⬅️ Oyun Modu Seçimine Dön
            </button>
          </div>
        </div>
      )}
    </main>
  );
}