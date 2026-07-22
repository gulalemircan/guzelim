"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

const CATEGORIES = {
  unlu: ["Tarkan", "Barış Manço", "Cem Yılmaz", "Marilyn Monroe", "Einstein", "Kemal Sunal", "Sezen Aksu", "Brad Pitt"],
  hayvan: ["Zürafa", "Penguen", "Ahtapot", "Kelaynak", "Bukalemun", "Tembel Hayvan", "Kutup Ayısı", "Şempanze"],
  meslek: ["Astronot", "Büyücü", "Korsan", "Tesisatçı", "Dedektif", "Cerrah", "Sihirbaz", "Cankurtaran"],
  nesne: ["Bulaşık Makinesi", "Tırnak Makası", "Pusula", "Büyüteç", "Kum Saati", "Şemsiye", "Daktilo"]
};

export default function BenKimimPage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [settings, setSettings] = useState({
    rounds: 4, // Çift sayı olması iyi ki eşit oynansın
    timeLimit: 120 // 2 dakika
  });

  const [phase, setPhase] = useState<"modeSelect" | "settings" | "selectingWord" | "playing" | "roundResult" | "finalResult">("modeSelect");
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isMeReady, setIsMeReady] = useState(false);
  
  const targetOpponent = currentUser === "Emircan" ? "Efsun" : "Emircan";

  const [currentRound, setCurrentRound] = useState(1);
  const [targetWord, setTargetWord] = useState("");
  const [customWordInput, setCustomWordInput] = useState("");
  
  const [timeLeft, setTimeLeft] = useState(120);
  
  // Roller
  const [guesser, setGuesser] = useState<string>(""); // Tahmin Eden (Kör)
  const [answerer, setAnswerer] = useState<string>(""); // Cevaplayan (Gören)

  // Kumanda Sinyali
  const [signalFlash, setSignalFlash] = useState<"evet" | "hayir" | "bazen" | null>(null);

  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [lastRoundResult, setLastRoundResult] = useState<"bildi" | "bilemedi" | null>(null);

  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [isSaved, setIsSaved] = useState(false);

  const phaseRef = useRef(phase);
  const currentRoundRef = useRef(currentRound);
  const settingsRef = useRef(settings);
  const guesserRef = useRef(guesser);
  // YENİ: TypeScript hatasını çözen React kalıcı belleği
  const lastSignalIdRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { guesserRef.current = guesser; }, [guesser]);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('game_scores').select('*').eq('game_name', 'benkimim');
    if (data) {
      const emircanScores = data.filter(d => d.player_name === 'Emircan').map(d => d.score);
      const efsunScores = data.filter(d => d.player_name === 'Efsun').map(d => d.score);
      setLeaderboard({
        emircan: emircanScores.length ? emircanScores.reduce((a, b) => a + b, 0) : 0,
        efsun: efsunScores.length ? efsunScores.reduce((a, b) => a + b, 0) : 0,
      });
    }
  };

  useEffect(() => {
    const checkLobbyStatus = (data: any) => {
      const opState = currentUser === "Emircan" ? data.p2_state : data.p1_state;
      const myState = currentUser === "Emircan" ? data.p1_state : data.p2_state;
      const currentPhase = phaseRef.current;

      if (opState?.ready) setIsOpponentReady(true);
      else setIsOpponentReady(false);

      if (opState?.score !== undefined) setOpponentScore(opState.score);

      if (data.status === 'waiting' && currentPhase !== 'modeSelect' && currentPhase !== 'settings') {
         setPhase('settings');
         setMyScore(0);
         setOpponentScore(0);
         setIsMeReady(false);
         setIsSaved(false);
      }

      // 1. KELİME SEÇME AŞAMASI
      if (data.status === 'selecting_word') {
          if (currentPhase !== 'selectingWord') {
             setSettings(data.shared_data.settings);
             setCurrentRound(data.shared_data.round);
             setGuesser(data.shared_data.guesser);
             setAnswerer(data.shared_data.answerer);
             setTargetWord("");
             setCustomWordInput("");
             setPhase("selectingWord");
          }
      }

      // 2. OYUN AŞAMASI
      if (data.status === 'playing') {
          if (currentPhase === 'selectingWord') {
             setTargetWord(data.shared_data.targetWord);
             setTimeLeft(data.shared_data.settings.timeLimit);
             setPhase("playing");
             playSound("start");
          }
      }

      // CANLI SİNYAL DİNLEYİCİ (Kör Ekran İçin - TYPESCRIPT HATASI ÇÖZÜLDÜ)
      if (data.status === 'playing' && currentPhase === 'playing') {
          if (data.shared_data.signalId && data.shared_data.signalId !== lastSignalIdRef.current) {
             lastSignalIdRef.current = data.shared_data.signalId;
             const sig = data.shared_data.signal;
             setSignalFlash(sig);
             
             if (sig === 'evet') playSound("success");
             if (sig === 'hayir') playSound("error");
             if (sig === 'bazen') playSound("tick");

             setTimeout(() => setSignalFlash(null), 500); // Flaş efekti süresi
          }
      }

      // 3. TUR SONUCU AŞAMASI
      if (data.status === 'round_result' && currentPhase !== 'roundResult') {
          setTargetWord(data.shared_data.targetWord);
          setLastRoundResult(data.shared_data.roundResult);
          
          if (data.shared_data.roundResult === "bildi") playSound("success");
          else playSound("over");
          
          setPhase("roundResult");
      }

      if (data.status === 'game_over' && currentPhase !== 'finalResult') {
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
      .channel('lobby-channel-benkimim')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_state', filter: 'id=eq.1' }, (payload) => {
        checkLobbyStatus(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // SÜRE YÖNETİMİ (Sadece Cevaplayan Kişi Süreyi Yönetir ki Senkronizasyon Kaymasın)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "playing" && currentUser === answerer) {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          setTimeLeft(t => t - 1);
        }, 1000);
      } else {
        // Süre Bitti! (Bilemedi)
        triggerRoundEnd("bilemedi");
      }
    }
    
    // Kör ekranın süresi sadece görsel akış için
    if (phase === "playing" && currentUser === guesser) {
        if (timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        }
    }
    return () => clearTimeout(timer);
  }, [phase, timeLeft, currentUser, answerer, guesser]);


  const joinLobby = async () => {
    setPhase("settings");
    setIsMeReady(false);
    playSound("click");
    fetchLeaderboard();

    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    await supabase.from('multiplayer_state').update({ 
        [playerField]: { joined: true, ready: false, score: 0 },
        ...(currentUser === "Emircan" ? { status: 'waiting' } : {}) 
    }).eq('id', 1);
  };

  const toggleReady = async () => {
    playSound("click");
    const newReadyState = !isMeReady;
    setIsMeReady(newReadyState);
    
    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    await supabase.from('multiplayer_state').update({
      [playerField]: { joined: true, ready: newReadyState }
    }).eq('id', 1);
  };

  const startGame = async () => {
    playSound("click");
    // İlk turda Efsun tahmin etsin, Emircan sorsun (veya tam tersi)
    const initialGuesser = "Efsun";
    const initialAnswerer = "Emircan";
    
    await supabase.from('multiplayer_state').update({
      status: 'selecting_word',
      shared_data: { settings: settingsRef.current, round: 1, guesser: initialGuesser, answerer: initialAnswerer },
      p1_state: { joined: true, ready: true, score: 0, nextRoundReady: false },
      p2_state: { joined: true, ready: true, score: 0, nextRoundReady: false }
    }).eq('id', 1);
  };

  // KELİME SEÇİMİ (GÖREN KİŞİ YAPAR)
  const submitTargetWord = async (word: string) => {
      playSound("click");
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) {
         await supabase.from('multiplayer_state').update({
             status: 'playing',
             shared_data: { ...data.shared_data, targetWord: word.toLocaleUpperCase('tr-TR'), signal: null, signalId: 0 }
         }).eq('id', 1);
      }
  };

  // KUMANDA BUTONLARI
  const sendSignal = async (type: "evet" | "hayir" | "bazen") => {
      playSound("click");
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) {
          const newSignalId = (data.shared_data.signalId || 0) + 1;
          await supabase.from('multiplayer_state').update({
              shared_data: { ...data.shared_data, signal: type, signalId: newSignalId }
          }).eq('id', 1);
      }
  };

  // TUR BİTİRME (Bildiyse veya Süre Bittiyse)
  const triggerRoundEnd = async (result: "bildi" | "bilemedi") => {
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      
      if (data) {
          let newGuesserScore = result === "bildi" ? (data[guesser === "Emircan" ? "p1_state" : "p2_state"]?.score || 0) + 1 : (data[guesser === "Emircan" ? "p1_state" : "p2_state"]?.score || 0);

          await supabase.from('multiplayer_state').update({
              status: 'round_result',
              shared_data: { ...data.shared_data, roundResult: result },
              [guesser === "Emircan" ? "p1_state" : "p2_state"]: { ...data[guesser === "Emircan" ? "p1_state" : "p2_state"], score: newGuesserScore },
              p1_state: { ...data.p1_state, nextRoundReady: false, ...(guesser === "Emircan" ? {score: newGuesserScore} : {}) },
              p2_state: { ...data.p2_state, nextRoundReady: false, ...(guesser === "Efsun" ? {score: newGuesserScore} : {}) }
          }).eq('id', 1);
          
          if(guesser === currentUser) setMyScore(newGuesserScore);
          else setOpponentScore(newGuesserScore);
      }
  };

  // SONRAKİ TURA GEÇİŞ VEYA OYUN SONU
  const handleNextRoundReady = async () => {
    playSound("click");
    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    const opField = currentUser === "Emircan" ? "p2_state" : "p1_state";
    
    const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
    
    if (data) {
       const opIsReady = data[opField]?.nextRoundReady;
       const myNewState = { ...data[playerField], nextRoundReady: true };

       if (opIsReady) {
           if (currentRoundRef.current < settingsRef.current.rounds) {
               // Rolleri Değiştir
               const nextGuesser = data.shared_data.answerer;
               const nextAnswerer = data.shared_data.guesser;
               
               await supabase.from('multiplayer_state').update({
                  status: 'selecting_word',
                  shared_data: { ...data.shared_data, round: currentRoundRef.current + 1, guesser: nextGuesser, answerer: nextAnswerer },
                  p1_state: { ...data.p1_state, nextRoundReady: false },
                  p2_state: { ...data.p2_state, nextRoundReady: false }
               }).eq('id', 1);
           } else {
               await supabase.from('multiplayer_state').update({ status: 'game_over' }).eq('id', 1);
           }
       } else {
           await supabase.from('multiplayer_state').update({ [playerField]: myNewState }).eq('id', 1);
       }
    }
  };

  const saveScoreToDatabase = async () => {
    if (isSaved) return;
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'benkimim',
      player_name: currentUser,
      score: myScore
    }]);
    setIsSaved(true);
    fetchLeaderboard();
  };

  const exitLobby = async () => {
      playSound("click");
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) {
        await supabase.from('multiplayer_state').update({ 
          status: 'waiting',
          p1_state: { ...data.p1_state, joined: false, ready: false },
          p2_state: { ...data.p2_state, joined: false, ready: false }
        }).eq('id', 1);
      }
      setPhase("modeSelect");
      setIsMeReady(false);
  };


  return (
    <main className="p-5 animate-in fade-in duration-500 pb-24 min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300"
      style={{
          backgroundColor: phase === "playing" && currentUser === guesser && signalFlash === "evet" ? "rgba(34, 197, 94, 0.2)" : 
                           phase === "playing" && currentUser === guesser && signalFlash === "hayir" ? "rgba(239, 68, 68, 0.2)" : 
                           phase === "playing" && currentUser === guesser && signalFlash === "bazen" ? "rgba(234, 179, 8, 0.2)" : ""
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .game-active-ui div[class*="fixed"][class*="bottom-"] {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: all 0.3s ease;
        }
      `}} />

      {phase === "modeSelect" || phase === "settings" || phase === "finalResult" ? (
        <div className="flex items-center mb-4 z-10">
          <Link href="/games" onClick={() => playSound("click")} className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
            <span>←</span> Oyunlar
          </Link>
        </div>
      ) : null}

      {/* 1. GİRİŞ EKRANI */}
      {phase === "modeSelect" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in slide-in-from-bottom-5 max-w-md mx-auto w-full z-10">
          <div className="text-center mb-2">
            <div className="text-6xl mb-4 drop-shadow-lg">🎭</div>
            <h2 className="display-font text-4xl text-primary font-black">Ben Kimim?</h2>
            <p className="text-text/70 text-sm mt-2 font-medium tracking-wide">Yüz yüze oynamalık dijital masa!</p>
          </div>

          <div className="w-full flex flex-col gap-4 px-2">
            <button 
              onClick={joinLobby}
              className="w-full bg-primary text-background p-6 rounded-[32px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center gap-3 group border-2 border-transparent relative overflow-hidden"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300 relative z-10">👥</span>
              <span className="font-black tracking-widest uppercase text-lg relative z-10">Odaya Katıl</span>
              <span className="bg-background/20 text-background px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">
                Karşılıklı Oynanır
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. LOBİ & AYARLAR */}
      {phase === "settings" && (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-5 max-w-md mx-auto w-full z-10">
          
          <div className="text-center mb-2">
            <div className="text-5xl mb-2">⚙️</div>
            <h2 className="display-font text-3xl text-primary">Bekleme Odası</h2>
          </div>

          <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-1">Emircan</span>
              <span className="text-3xl font-black text-primary">{leaderboard.emircan}</span>
            </div>
            <div className="text-2xl opacity-50 flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-bold mb-1">TOPLAM GALİBİYET</span>
               ⚔️
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-1">Efsun</span>
              <span className="text-3xl font-black text-primary">{leaderboard.efsun}</span>
            </div>
          </div>
          
          {currentUser === "Efsun" ? (
            <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-bounce">⏳</div>
                <h3 className="display-font text-2xl text-primary mb-2">Kurallar Belirleniyor</h3>
                <p className="text-text/60 text-xs font-bold tracking-widest uppercase">Emircan ayarları seçiyor...</p>
              </div>
              <button onClick={toggleReady} className={`w-full py-5 rounded-[24px] font-black text-xl tracking-widest uppercase shadow-2xl transition-all duration-300 ${isMeReady ? 'bg-green-500 text-white border-4 border-green-400/50' : 'bg-card border-4 border-primary text-primary hover:bg-primary hover:text-background'}`}>
                {isMeReady ? "👍 HAZIRSIN" : "HAZIRIM"}
              </button>
            </div>
          ) : (
            <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
              
              <div>
                <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Tur Sayısı (Çift Olmalı)</label>
                <div className="flex gap-2">
                  {[2, 4, 6, 8].map(num => (
                    <button key={num} onClick={() => { setSettings({...settings, rounds: num}); playSound("click"); }} className={`flex-1 py-2 rounded-xl font-bold transition-all ${settings.rounds === num ? 'bg-primary text-background shadow-lg' : 'bg-background border border-primary/20 text-text/70'}`}>{num}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Süre Limit (Saniye)</label>
                <div className="flex gap-2">
                  {[60, 90, 120, 180].map(time => (
                    <button key={time} onClick={() => { setSettings({...settings, timeLimit: time}); playSound("click"); }} className={`flex-1 py-2 rounded-xl font-bold transition-all ${settings.timeLimit === time ? 'bg-red-500 text-white shadow-lg' : 'bg-background border border-red-500/20 text-text/70'}`}>{time}s</button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {currentUser === "Emircan" && (
            <button onClick={startGame} disabled={!isOpponentReady} className={`w-full mt-2 p-5 rounded-2xl shadow-xl transition-all duration-300 font-black text-lg tracking-widest uppercase ${isOpponentReady ? 'bg-primary text-background hover:scale-[1.02] ring-4 ring-primary/30' : 'bg-background border-2 border-primary/20 text-primary/40 cursor-not-allowed'}`}>
              {isOpponentReady ? "OYUNU BAŞLAT 🚀" : "EFSUN'UN HAZIR OLMASI BEKLENİYOR..."}
            </button>
          )}

          <button onClick={exitLobby} className="text-[10px] text-red-500 uppercase tracking-widest font-bold mt-2 hover:underline text-center w-full">Odadan Çık</button>
        </div>
      )}

      {/* 3. KELİME SEÇME AŞAMASI */}
      {phase === "selectingWord" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in slide-in-from-right-5 max-w-md mx-auto w-full z-10">
            {currentUser === answerer ? (
                // CEVAPLAYAN / SEÇEN KİŞİ EKRANI
                <div className="w-full flex flex-col gap-6 bg-card p-6 rounded-3xl border border-primary/20 shadow-2xl">
                    <div className="text-center mb-2">
                        <span className="text-4xl">🤔</span>
                        <h2 className="display-font text-2xl text-primary mt-2">Sıra Sende!</h2>
                        <p className="text-xs text-text/60 font-bold uppercase tracking-widest mt-1">{guesser} neyi tahmin edecek?</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-primary uppercase tracking-widest">Kendi Kelimeni Yaz (Zula!)</label>
                        <input 
                           type="text" 
                           placeholder="Örn: Evdeki saksı, Cedi Osman..." 
                           value={customWordInput}
                           onChange={e => setCustomWordInput(e.target.value)}
                           className="w-full bg-background border border-primary/30 rounded-xl p-4 text-white font-bold outline-none focus:border-primary"
                        />
                        <button 
                           onClick={() => { if(customWordInput.trim()) submitTargetWord(customWordInput); }}
                           className="w-full bg-primary text-background font-black p-4 rounded-xl mt-1 active:scale-95 transition-transform"
                        >
                            Bu Kelimeyle Başla 🚀
                        </button>
                    </div>

                    <div className="flex items-center gap-2 opacity-50 my-2">
                        <div className="h-px bg-primary/20 flex-1"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">VEYA HAZIR SEÇ</span>
                        <div className="h-px bg-primary/20 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => submitTargetWord(CATEGORIES.unlu[Math.floor(Math.random() * CATEGORIES.unlu.length)])} className="bg-background border border-primary/20 p-3 rounded-xl font-bold text-sm text-text/80 hover:bg-primary/10">⭐ Ünlü Biri</button>
                        <button onClick={() => submitTargetWord(CATEGORIES.hayvan[Math.floor(Math.random() * CATEGORIES.hayvan.length)])} className="bg-background border border-primary/20 p-3 rounded-xl font-bold text-sm text-text/80 hover:bg-primary/10">🐾 Hayvan</button>
                        <button onClick={() => submitTargetWord(CATEGORIES.meslek[Math.floor(Math.random() * CATEGORIES.meslek.length)])} className="bg-background border border-primary/20 p-3 rounded-xl font-bold text-sm text-text/80 hover:bg-primary/10">💼 Meslek</button>
                        <button onClick={() => submitTargetWord(CATEGORIES.nesne[Math.floor(Math.random() * CATEGORIES.nesne.length)])} className="bg-background border border-primary/20 p-3 rounded-xl font-bold text-sm text-text/80 hover:bg-primary/10">🧦 Eşya/Nesne</button>
                    </div>
                </div>
            ) : (
                // TAHMİN EDEN (KÖR) KİŞİ EKRANI
                <div className="text-center">
                    <div className="text-6xl mb-6 animate-spin drop-shadow-xl">⏳</div>
                    <h2 className="display-font text-3xl text-primary mb-2 text-center">Gözlerini Kapat!</h2>
                    <p className="text-text/70 uppercase tracking-widest text-sm font-bold animate-pulse text-center px-4">
                       {answerer} sana acımasız bir kelime seçiyor...
                    </p>
                </div>
            )}
        </div>
      )}

      {/* 4. OYUN AŞAMASI */}
      {phase === "playing" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300 w-full max-w-md mx-auto z-10 h-full">
            
            <div className="absolute top-0 w-full flex justify-between px-6 pt-6 pointer-events-none">
                 <span className="bg-black/30 backdrop-blur-md text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-lg shadow-sm">
                   TUR {currentRound} / {settings.rounds}
                 </span>
                 <span className={`px-4 py-1 rounded-lg font-black text-sm shadow-sm transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-primary text-background'}`}>
                   ⏱️ {timeLeft}
                 </span>
            </div>

            {currentUser === guesser ? (
                // TAHMİN EDEN (KÖR) EKRANI (Devasa Soru İşareti)
                <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
                    <div className={`transition-all duration-300 flex items-center justify-center rounded-full w-64 h-64 border-[8px] shadow-[0_0_50px_rgba(0,0,0,0.3)] ${signalFlash === "evet" ? "bg-green-500 border-green-400 scale-110 shadow-green-500/50" : signalFlash === "hayir" ? "bg-red-500 border-red-400 scale-90 shadow-red-500/50" : signalFlash === "bazen" ? "bg-yellow-500 border-yellow-400 scale-105 shadow-yellow-500/50" : "bg-card border-primary/20"}`}>
                        <span className={`display-font text-[150px] transition-colors ${signalFlash ? "text-white" : "text-primary"}`}>?</span>
                    </div>
                    <h2 className="display-font text-3xl text-primary mt-12 mb-2 font-black tracking-widest uppercase">SORU SOR!</h2>
                    <p className="text-text/50 text-xs font-bold uppercase tracking-widest text-center">
                        {answerer}'a sorular sor, o kendi ekranından tuşlara basarak sana cevap verecek.
                    </p>
                </div>
            ) : (
                // CEVAPLAYAN (GÖREN) KUMANDA EKRANI
                <div className="flex-1 flex flex-col items-center justify-between w-full mt-16 mb-4">
                    <div className="w-full bg-card border-2 border-primary/30 p-8 rounded-[40px] shadow-2xl flex flex-col items-center text-center">
                        <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold mb-2">Gizli Kelime</span>
                        <h2 className="display-font text-5xl text-primary font-black break-words w-full">{targetWord}</h2>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-auto">
                        <div className="flex w-full gap-3">
                            <button onClick={() => sendSignal("evet")} className="flex-1 h-32 bg-green-500/10 border-4 border-green-500 text-green-500 rounded-3xl font-black text-3xl hover:bg-green-500 hover:text-white transition-colors flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.3)] active:scale-95">
                                ✅ <span className="text-sm mt-1 uppercase tracking-widest">Evet</span>
                            </button>
                            <button onClick={() => sendSignal("hayir")} className="flex-1 h-32 bg-red-500/10 border-4 border-red-500 text-red-500 rounded-3xl font-black text-3xl hover:bg-red-500 hover:text-white transition-colors flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(239,68,68,0.3)] active:scale-95">
                                ❌ <span className="text-sm mt-1 uppercase tracking-widest">Hayır</span>
                            </button>
                        </div>
                        <div className="flex w-full gap-3">
                            <button onClick={() => sendSignal("bazen")} className="flex-1 bg-yellow-500/10 border-4 border-yellow-500 text-yellow-500 py-4 rounded-3xl font-black text-xl hover:bg-yellow-500 hover:text-white transition-colors flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(234,179,8,0.3)] active:scale-95">
                                🤷 Bazen / Kısmen
                            </button>
                        </div>
                        <button onClick={() => triggerRoundEnd("bildi")} className="w-full mt-4 bg-primary text-background py-5 rounded-3xl font-black text-2xl hover:scale-[1.02] transition-transform shadow-2xl uppercase tracking-widest">
                            🏆 DOĞRU BİLDİ!
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* 5. TUR SONUCU */}
      {phase === "roundResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300 w-full max-w-md mx-auto z-10">
          <div className="text-7xl mb-4 drop-shadow-lg">{lastRoundResult === "bildi" ? "🏆" : "⌛"}</div>
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">
             {lastRoundResult === "bildi" ? "Harika Tahmin!" : "Süre Bitti..."}
          </h2>
          
          <div className="w-full bg-card border-2 border-primary/30 p-8 rounded-[40px] shadow-2xl flex flex-col items-center text-center my-6">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-2">Gizli Kelime Şuydu:</span>
              <h2 className="display-font text-5xl text-primary font-black break-words w-full">{targetWord}</h2>
          </div>

          <div className="w-full flex justify-between bg-background border border-primary/10 p-4 rounded-2xl mb-8 shadow-inner">
             <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text/50 mb-1">Sen</span>
                <span className="text-3xl font-black text-primary">{myScore}</span>
             </div>
             <div className="w-px bg-primary/20"></div>
             <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text/50 mb-1">{targetOpponent}</span>
                <span className="text-3xl font-black text-primary">{opponentScore}</span>
             </div>
          </div>

          <button onClick={handleNextRoundReady} className="w-full bg-primary text-background py-5 rounded-2xl font-black text-xl hover:scale-[1.02] transition-transform shadow-xl uppercase tracking-widest">
             {currentRound < settings.rounds ? "Sıradaki Tura Hazırım" : "Maç Sonucunu Gör 🏆"}
          </button>
        </div>
      )}

      {/* 6. FİNAL SONUCU */}
      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full z-10">
          <div className="text-7xl mb-4 drop-shadow-lg">👑</div>
          
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">
            {myScore > opponentScore ? "Kazanan Sen Oldun! 🏆" :
             myScore < opponentScore ? `Kazanan ${targetOpponent}! 😔` :
             "Berabere! 🤝"}
          </h2>
          
          <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
            Toplam {settings.rounds} turun sonundaki puanlar:
          </p>

          <div className="flex gap-4 w-full justify-center mb-8">
            <div className={`bg-card border ${myScore >= opponentScore ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-primary/20'} w-1/2 p-6 rounded-[32px] shadow-xl flex flex-col items-center relative`}>
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-2">Sen</span>
              <h3 className="display-font text-6xl text-primary font-black">{myScore}</h3>
            </div>
            
            <div className={`bg-card border ${opponentScore >= myScore ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-primary/20'} w-1/2 p-6 rounded-[32px] shadow-xl flex flex-col items-center relative`}>
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-2">{targetOpponent}</span>
              <h3 className="display-font text-6xl text-primary font-black">{opponentScore}</h3>
            </div>
          </div>

          {!isSaved ? (
             <button 
              onClick={saveScoreToDatabase}
              className="w-full bg-primary text-background py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform text-lg mb-4 uppercase tracking-widest"
            >
              Skorunu Kaydet 💾
            </button>
          ) : (
            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-2xl font-bold text-center mb-4">
              Skor başarıyla kaydedildi! ✅
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button onClick={joinLobby} className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg">
              🔄 Lobiye Dön
            </button>
            <Link href="/games" onClick={() => playSound("click")} className="w-full bg-card border border-primary/20 text-text/80 p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center">
              ⬅️ Oyunlar Menüsü
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}