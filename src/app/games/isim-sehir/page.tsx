"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio"; 

const ALPHABET = ["A", "B", "C", "Ç", "D", "E", "F", "G", "H", "I", "İ", "J", "K", "L", "M", "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z"];

const CATEGORIES = [
  { id: "isim", label: "👤 İsim" },
  { id: "sehir", label: "🏙️ Şehir" },
  { id: "hayvan", label: "🐾 Hayvan" },
  { id: "bitki", label: "🌿 Bitki" },
  { id: "esya", label: "🧦 Eşya" },
  { id: "meslek", label: "💼 Meslek" },
  { id: "unlu", label: "⭐ Ünlü" },
  { id: "ulke", label: "🌍 Ülke" },
  { id: "dizifilm", label: "🎬 Dizi/Film" },
  { id: "marka", label: "🏷️ Marka" },
  { id: "sanatci", label: "🎤 Sanatçı" },
  { id: "sarki", label: "🎵 Şarkı" },
  { id: "spordali", label: "⚽ Spor Dalı" },
  { id: "oyun", label: "🎮 Oyun" }
];

export default function IsimSehirPage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [settings, setSettings] = useState({
    rounds: 3,
    timerMode: "timed" as "timed" | "manual",
    timeLimit: 60,
    selectedLetters: [...ALPHABET],
    selectedCategories: CATEGORIES.map(c => c.id),
    usedLetters: [] as string[]
  });

  // YENİ: "countdown" (Geri sayım) aşaması eklendi!
  const [phase, setPhase] = useState<"modeSelect" | "settings" | "countdown" | "playing" | "waitingRound" | "roundResult" | "finalResult">("modeSelect");
  const [playMode, setPlayMode] = useState<"single" | "multi" | null>(null);
  
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isMeReady, setIsMeReady] = useState(false);
  const targetOpponent = currentUser === "Emircan" ? "Efsun" : "Emircan";

  const [currentRound, setCurrentRound] = useState(1);
  const [targetLetter, setTargetLetter] = useState("A");
  
  const [timeLeft, setTimeLeft] = useState(60);
  const [countdownTime, setCountdownTime] = useState(3);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [opponentAnswers, setOpponentAnswers] = useState<Record<string, string>>({});
  
  // YENİ: Hakem (Puanlama Onay) State'leri
  const [myValidations, setMyValidations] = useState<Record<string, boolean>>({});
  const [opponentValidations, setOpponentValidations] = useState<Record<string, boolean>>({});
  
  const [myTotalScore, setMyTotalScore] = useState(0);
  const [opponentTotalScore, setOpponentTotalScore] = useState(0);

  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [winSaved, setWinSaved] = useState(false);

  const phaseRef = useRef(phase);
  const currentRoundRef = useRef(currentRound);
  const settingsRef = useRef(settings);
  const myTotalScoreRef = useRef(myTotalScore);
  const answersRef = useRef(answers);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { myTotalScoreRef.current = myTotalScore; }, [myTotalScore]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

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

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('game_scores').select('*').eq('game_name', 'isim_sehir_win');
    if (data) {
      const emircanWins = data.filter(d => d.player_name === 'Emircan').length;
      const efsunWins = data.filter(d => d.player_name === 'Efsun').length;
      setLeaderboard({ emircan: emircanWins, efsun: efsunWins });
    }
  };

  useEffect(() => {
    if (phase === "finalResult" && !isSaved) {
      supabase.from('game_scores').insert([{
        game_name: 'isim_sehir',
        player_name: currentUser,
        score: myTotalScore
      }]).then(() => setIsSaved(true));

      if (playMode === "multi" && !winSaved) {
        if (myTotalScore > opponentTotalScore) {
          supabase.from('game_scores').insert([{
            game_name: 'isim_sehir_win',
            player_name: currentUser,
            score: 1
          }]).then(() => {
            setWinSaved(true);
            fetchLeaderboard();
          });
        } else {
          setTimeout(fetchLeaderboard, 2000);
          setWinSaved(true);
        }
      }
    }
  }, [phase, isSaved, winSaved, myTotalScore, opponentTotalScore, playMode, currentUser]);

  useEffect(() => {
    if (playMode !== "multi") return;

    const checkLobbyStatus = (data: any) => {
      const opState = currentUser === "Emircan" ? data.p2_state : data.p1_state;
      const myState = currentUser === "Emircan" ? data.p1_state : data.p2_state;
      const currentPhase = phaseRef.current;
      const currentSettings = settingsRef.current;

      if (opState?.ready) setIsOpponentReady(true);
      else setIsOpponentReady(false);

      if (opState?.totalScore !== undefined) setOpponentTotalScore(opState.totalScore);
      
      // Hakem State'leri Canlı Senkronize Ediliyor
      if (myState?.validations) setMyValidations(myState.validations);
      if (opState?.validations) setOpponentValidations(opState.validations);

      if (data.status === 'waiting' && (currentPhase === 'finalResult' || currentPhase === 'waitingRound' || currentPhase === 'roundResult')) {
         setPhase('settings');
         setMyTotalScore(0);
         setOpponentTotalScore(0);
         setAnswers({});
         setOpponentAnswers({});
         setMyValidations({});
         setOpponentValidations({});
         setIsSaved(false);
         setWinSaved(false);
         setIsMeReady(false);
      }

      // YENİ: BAŞLAMA SİNYALİ GELDİĞİNDE DİREKT 3 SANİYELİK SAYACA GİRER
      if (data.status === 'countdown') {
         // Eğer tur sonucundan (roundResult) buraya geçiyorsak, önce o turun kesinleşmiş puanlarını topla!
         if (currentPhase === 'roundResult') {
             const finalVals = myState?.validations || {};
             const roundScore = CATEGORIES.filter(c => currentSettings.selectedCategories.includes(c.id) && finalVals[c.id]).length * 10;
             setMyTotalScore(prev => prev + roundScore);
         }
         
         if (currentPhase !== 'countdown') {
            setSettings(data.shared_data.settings);
            setCurrentRound(data.shared_data.round);
            setTargetLetter(data.shared_data.targetLetter);
            setAnswers({});
            setOpponentAnswers({});
            setMyValidations({});
            setOpponentValidations({});
            setCountdownTime(3);
            setPhase("countdown");
            playSound("tick");
         }
      }

      // İKİ OYUNCU DA BİTİRDİĞİNDE HAKEM MASASINA (roundResult) GEÇER
      if (data.status === 'countdown' || data.status === 'playing') {
          if (myState?.roundFinished && opState?.roundFinished && currentPhase === 'waitingRound') {
             setOpponentAnswers(opState.answers || {});
             setPhase('roundResult');
             playSound("success");
          }
      }

      // OYUN BİTTİĞİNDE
      if (data.status === 'game_over') {
        if (currentPhase === 'roundResult') {
            const finalVals = myState?.validations || {};
            const roundScore = CATEGORIES.filter(c => currentSettings.selectedCategories.includes(c.id) && finalVals[c.id]).length * 10;
            setMyTotalScore(prev => prev + roundScore);
        }
        if (currentPhase !== 'finalResult') {
            setPhase('finalResult');
            playSound("over");
        }
      }
    };

    const fetchInitialLobby = async () => {
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) checkLobbyStatus(data);
    };

    fetchInitialLobby();

    const channel = supabase
      .channel('lobby-channel-isim')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_state', filter: 'id=eq.1' }, (payload) => {
        checkLobbyStatus(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [playMode, currentUser]);

  // YENİ: 3 SANİYE GERİ SAYIM MOTORU (Aynı Anda Başlamak İçin)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "countdown") {
      if (countdownTime > 0) {
        timer = setTimeout(() => { 
            setCountdownTime(c => c - 1); 
            playSound("tick"); 
        }, 1000);
      } else {
        setPhase("playing");
        setTimeLeft(settings.timeLimit);
        playSound("start");
      }
    }
    return () => clearTimeout(timer);
  }, [phase, countdownTime, settings.timeLimit]);

  // SÜRE BİTİNCE VEYA MANUEL BİTİRİLİNCE
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "playing" && settings.timerMode === "timed") {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          setTimeLeft(t => t - 1);
          if (timeLeft <= 10) playSound("tick");
        }, 1000);
      } else {
        finishRound();
      }
    }
    return () => clearTimeout(timer);
  }, [phase, timeLeft, settings.timerMode]);

  const joinMultiplayer = async () => {
    setPlayMode("multi");
    setPhase("settings");
    setIsMeReady(false);
    playSound("click");
    fetchLeaderboard();

    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    await supabase.from('multiplayer_state').update({ 
        [playerField]: { joined: true, ready: false, roundFinished: false },
        ...(currentUser === "Emircan" ? { status: 'waiting' } : {}) 
    }).eq('id', 1);
  };

  const returnToLobby = async () => {
    playSound("click");
    setPhase("settings");
    setIsMeReady(false);
    setAnswers({});
    setMyTotalScore(0);
    setOpponentTotalScore(0);
    setIsSaved(false);
    setWinSaved(false);
    fetchLeaderboard();
    
    if (playMode === "multi") {
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) {
        await supabase.from('multiplayer_state').update({ 
          status: 'waiting',
          p1_state: { ...data.p1_state, ready: false, roundFinished: false },
          p2_state: { ...data.p2_state, ready: false, roundFinished: false }
        }).eq('id', 1);
      }
    }
  };

  const returnToMenu = async () => {
    playSound("click");
    if (playMode === "multi") {
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) {
        await supabase.from('multiplayer_state').update({ 
          status: 'waiting',
          p1_state: { ...data.p1_state, joined: false, ready: false },
          p2_state: { ...data.p2_state, joined: false, ready: false }
        }).eq('id', 1);
      }
    }
    setPhase("modeSelect");
    setPlayMode(null);
    setIsMeReady(false);
    setAnswers({});
    setIsSaved(false);
    setWinSaved(false);
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

  const getRandomLetter = (selected: string[], used: string[]) => {
    const available = selected.filter(l => !used.includes(l));
    if (available.length === 0) return selected[Math.floor(Math.random() * selected.length)]; 
    return available[Math.floor(Math.random() * available.length)];
  };

  const startMultiplayerGame = async () => {
    playSound("click");
    const initialLetter = getRandomLetter(settingsRef.current.selectedLetters, []);
    const newUsed = [initialLetter];
    
    await supabase.from('multiplayer_state').update({
      status: 'countdown', // YENİ: Doğrudan countdown (geri sayım) aşamasına atlar
      shared_data: { settings: { ...settingsRef.current, usedLetters: newUsed }, targetLetter: initialLetter, round: 1 },
      p1_state: { joined: true, ready: true, roundFinished: false, totalScore: 0, answers: {}, validations: {} },
      p2_state: { joined: true, ready: true, roundFinished: false, totalScore: 0, answers: {}, validations: {} }
    }).eq('id', 1);
  };

  const startSinglePlayerGame = () => {
    playSound("click");
    setCurrentRound(1);
    setAnswers({});
    setIsSaved(false);
    setWinSaved(false);
    setMyTotalScore(0);
    
    const initialLetter = getRandomLetter(settingsRef.current.selectedLetters, []);
    setSettings(prev => ({ ...prev, usedLetters: [initialLetter] }));
    setTargetLetter(initialLetter);
    setCountdownTime(3);
    setPhase("countdown");
  };

  // YENİ: TUR BİTİNCE OTOMATİK HAKEMLİK (Taslak Puanlaması Çıkarılır)
  const finishRound = async () => {
    playSound("click");
    
    const initialValidations: Record<string, boolean> = {};
    settingsRef.current.selectedCategories.forEach(cat => {
        const val = (answersRef.current[cat] || "").trim().toLocaleUpperCase('tr-TR');
        initialValidations[cat] = val.length > 1 && val.startsWith(targetLetter);
    });

    if (playMode === "multi") {
      setPhase("waitingRound");
      const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
      
      const myNewState = { 
        joined: true, 
        ready: true, 
        roundFinished: true, 
        answers: answersRef.current,
        validations: initialValidations,
        totalScore: myTotalScoreRef.current
      };

      try {
        const { data: latestData } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
        const opponentField = currentUser === "Emircan" ? "p2_state" : "p1_state";
        
        await supabase.from('multiplayer_state').update({ [playerField]: myNewState }).eq('id', 1);
      } catch (error) {
        console.error(error);
      }
    } else {
      setMyValidations(initialValidations);
      setPhase("roundResult");
    }
  };

  // YENİ: KABUL / İPTAL TIKLAMA FONKSİYONU
  const toggleValidation = async (isMine: boolean, catId: string) => {
    playSound("click");
    if (playMode === "single") {
        setMyValidations(prev => ({ ...prev, [catId]: !prev[catId] }));
        return;
    }

    // Hangi oyuncunun onay kutusuna tıklandıysa o alanı bul ve Supabase'de güncelle
    const playerField = isMine ? (currentUser === "Emircan" ? "p1_state" : "p2_state") : (currentUser === "Emircan" ? "p2_state" : "p1_state");
    
    const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
    if (data && data[playerField]) {
        const currentValidations = data[playerField].validations || {};
        await supabase.from('multiplayer_state').update({
            [playerField]: {
                ...data[playerField],
                validations: { ...currentValidations, [catId]: !currentValidations[catId] }
            }
        }).eq('id', 1);
    }
  };

  // HAKEMLİK BİTİNCE DİĞER TURA GEÇİŞ
  const handleNext = async () => {
    playSound("click");

    if (currentRoundRef.current < settingsRef.current.rounds) {
      if (playMode === "multi") {
         const { data: latestData } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
         if (latestData) {
            const nextLetter = getRandomLetter(latestData.shared_data.settings.selectedLetters, latestData.shared_data.settings.usedLetters);
            const newUsed = [...latestData.shared_data.settings.usedLetters, nextLetter];
            
            await supabase.from('multiplayer_state').update({
               status: 'countdown', // Otomatik Puanlama toplanıp Sayaca girer
               shared_data: { ...latestData.shared_data, settings: { ...latestData.shared_data.settings, usedLetters: newUsed }, targetLetter: nextLetter, round: currentRoundRef.current + 1 },
               p1_state: { ...latestData.p1_state, roundFinished: false },
               p2_state: { ...latestData.p2_state, roundFinished: false }
            }).eq('id', 1);
         }
      } else if (playMode === "single") {
         // Tek Oyunculu Skor Kaydetme
         const rScore = CATEGORIES.filter(c => settingsRef.current.selectedCategories.includes(c.id) && myValidations[c]).length * 10;
         setMyTotalScore(prev => prev + rScore);

         const nextLetter = getRandomLetter(settingsRef.current.selectedLetters, settingsRef.current.usedLetters);
         setSettings(prev => ({ ...prev, usedLetters: [...prev.usedLetters, nextLetter] }));
         setCurrentRound(prev => prev + 1);
         setTargetLetter(nextLetter);
         setAnswers({});
         setCountdownTime(3);
         setPhase("countdown");
      }
    } else {
      if (playMode === "multi") {
         await supabase.from('multiplayer_state').update({ status: 'game_over' }).eq('id', 1);
      } else if (playMode === "single") {
         const rScore = CATEGORIES.filter(c => settingsRef.current.selectedCategories.includes(c.id) && myValidations[c]).length * 10;
         setMyTotalScore(prev => prev + rScore);
         playSound("over");
         setPhase("finalResult");
      }
    }
  };

  const toggleCategory = (catId: string) => {
    if (currentUser !== "Emircan" && playMode === "multi") return; 
    playSound("click");
    setSettings(prev => {
      const isSelected = prev.selectedCategories.includes(catId);
      if (isSelected && prev.selectedCategories.length === 1) return prev; 
      return {
        ...prev,
        selectedCategories: isSelected 
          ? prev.selectedCategories.filter(id => id !== catId)
          : [...prev.selectedCategories, catId]
      };
    });
  };

  const toggleLetter = (letter: string) => {
    if (currentUser !== "Emircan" && playMode === "multi") return;
    playSound("click");
    setSettings(prev => {
      const isSelected = prev.selectedLetters.includes(letter);
      if (isSelected && prev.selectedLetters.length === 1) return prev; 
      return {
        ...prev,
        selectedLetters: isSelected 
          ? prev.selectedLetters.filter(l => l !== letter)
          : [...prev.selectedLetters, letter]
      };
    });
  };

  const selectAllLetters = () => {
    if (currentUser !== "Emircan" && playMode === "multi") return;
    playSound("click");
    setSettings(prev => ({ ...prev, selectedLetters: [...ALPHABET] }));
  };

  const handleInputChange = (catId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [catId]: value }));
  };

  return (
    <main className="p-5 animate-in fade-in duration-500 pb-24 min-h-screen flex flex-col relative overflow-hidden">
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

      {phase === "modeSelect" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in slide-in-from-bottom-5 max-w-md mx-auto w-full z-10">
          <div className="text-center mb-2">
            <div className="text-6xl mb-4 drop-shadow-lg">🌍</div>
            <h2 className="display-font text-4xl text-primary font-black">İsim Şehir</h2>
            <p className="text-text/70 text-sm mt-2 font-medium tracking-wide">Nasıl oynamak istersin?</p>
          </div>

          <div className="w-full flex flex-col gap-4 px-2">
            <button 
              onClick={() => { setPlayMode("single"); setPhase("settings"); playSound("click"); }}
              className="w-full bg-card border-2 border-primary/20 hover:border-primary text-primary p-6 rounded-[32px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center gap-3 group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">👤</span>
              <span className="font-black tracking-widest uppercase text-lg">Tek Oyunculu</span>
              <span className="text-text/50 text-xs font-bold uppercase tracking-wider">Antrenman Yap</span>
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
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-5 max-w-md mx-auto w-full z-10">
          
          <div className="text-center mb-2">
            <div className="text-5xl mb-2">⚙️</div>
            <h2 className="display-font text-3xl text-primary">
              {playMode === "multi" && currentUser === "Efsun" ? "Bekleme Odası" : "Oyun Ayarları"}
            </h2>
          </div>

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
                <p className="text-text/60 text-xs font-bold tracking-widest uppercase">Emircan ayarları seçiyor...</p>
              </div>
              <button onClick={toggleReady} className={`w-full py-5 rounded-[24px] font-black text-xl tracking-widest uppercase shadow-2xl transition-all duration-300 ${isMeReady ? 'bg-green-500 text-white border-4 border-green-400/50' : 'bg-card border-4 border-primary text-primary hover:bg-primary hover:text-background'}`}>
                {isMeReady ? "👍 HAZIRSIN" : "HAZIRIM"}
              </button>
            </div>
          ) : (
            <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6 max-h-[50vh] overflow-y-auto">
              
              <div>
                <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Süre Modu</label>
                <div className="flex gap-3">
                  <button onClick={() => { setSettings({...settings, timerMode: "timed"}); playSound("click"); }} className={`flex-1 p-3 rounded-xl font-bold text-sm transition-all ${settings.timerMode === "timed" ? 'bg-primary text-background shadow-lg' : 'bg-background border border-primary/20 text-text/70'}`}>⏱️ Süreli</button>
                  <button onClick={() => { setSettings({...settings, timerMode: "manual"}); playSound("click"); }} className={`flex-1 p-3 rounded-xl font-bold text-sm transition-all ${settings.timerMode === "manual" ? 'bg-primary text-background shadow-lg' : 'bg-background border border-primary/20 text-text/70'}`}>🏁 Herkes Bitirince</button>
                </div>
              </div>

              {settings.timerMode === "timed" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block text-red-500">Sayaç (Saniye)</label>
                  <div className="flex gap-2">
                    {[30, 60, 90].map(time => (
                      <button key={time} onClick={() => { setSettings({...settings, timeLimit: time}); playSound("click"); }} className={`flex-1 py-2 rounded-xl font-bold transition-all ${settings.timeLimit === time ? 'bg-red-500 text-white shadow-lg' : 'bg-background border border-red-500/20 text-text/70'}`}>{time}s</button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Tur Sayısı</label>
                <div className="flex gap-2">
                  {[3, 5, 7, 10].map(num => (
                    <button key={num} onClick={() => { setSettings({...settings, rounds: num}); playSound("click"); }} className={`flex-1 py-2 rounded-xl font-bold transition-all ${settings.rounds === num ? 'bg-primary text-background shadow-lg' : 'bg-background border border-primary/20 text-text/70'}`}>{num}</button>
                  ))}
                </div>
              </div>

              <hr className="border-primary/10" />

              <div>
                <div className="flex justify-between items-center mb-3">
                   <label className="text-xs uppercase tracking-widest text-primary font-bold">Aktif Kategoriler</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => toggleCategory(cat.id)} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${settings.selectedCategories.includes(cat.id) ? 'bg-primary text-background border-primary shadow-md' : 'bg-background text-text/40 border-primary/20 hover:border-primary/50'}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-primary/10" />

              <div>
                <div className="flex justify-between items-center mb-3">
                   <label className="text-xs uppercase tracking-widest text-primary font-bold">Harf Havuzu</label>
                   <button onClick={selectAllLetters} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-bold">Hepsini Seç</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALPHABET.map(letter => (
                    <button key={letter} onClick={() => toggleLetter(letter)} className={`w-8 h-8 rounded-lg font-black text-sm flex items-center justify-center transition-all border ${settings.selectedLetters.includes(letter) ? 'bg-primary text-background border-primary shadow-sm' : 'bg-background text-text/30 border-primary/20 hover:border-primary/50'}`}>
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {playMode === "multi" && currentUser === "Emircan" ? (
            <button onClick={startMultiplayerGame} disabled={!isOpponentReady} className={`w-full mt-2 p-5 rounded-2xl shadow-xl transition-all duration-300 font-black text-lg tracking-widest uppercase ${isOpponentReady ? 'bg-primary text-background hover:scale-[1.02] ring-4 ring-primary/30' : 'bg-background border-2 border-primary/20 text-primary/40 cursor-not-allowed'}`}>
              {isOpponentReady ? "OYUNU BAŞLAT 🚀" : "EFSUN'UN HAZIR OLMASI BEKLENİYOR..."}
            </button>
          ) : playMode === "single" && (
            <button onClick={startSinglePlayerGame} className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg">
              Oyunu Başlat 🚀
            </button>
          )}

          {playMode === "multi" && (
             <button onClick={returnToMenu} className="text-[10px] text-red-500 uppercase tracking-widest font-bold mt-2 hover:underline text-center w-full">Odadan Çık</button>
          )}
        </div>
      )}

      {/* YENİ: 3... 2... 1... GERİ SAYIM EKRANI */}
      {phase === "countdown" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300 w-full z-10">
          <h2 className="display-font text-5xl text-primary mb-4 text-center">Hazır Ol!</h2>
          <div className="text-9xl font-black text-primary drop-shadow-2xl animate-pulse">
             {countdownTime > 0 ? countdownTime : "BAŞLA!"}
          </div>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex-1 flex flex-col items-center animate-in zoom-in duration-300 w-full max-w-md mx-auto z-10">
          
          <div className="absolute top-0 right-5 z-10 pointer-events-none">
            <span className="bg-black/30 backdrop-blur-md text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-b-lg shadow-sm">
              TUR {currentRound} / {settings.rounds}
            </span>
          </div>

          <div className="w-full flex justify-between items-center mb-6 mt-4">
            <div className="bg-card border border-primary/30 px-8 py-3 rounded-2xl flex items-center shadow-lg gap-4">
              <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Harf</span>
              <span className="text-5xl font-black text-primary drop-shadow-md">{targetLetter}</span>
            </div>
            
            <div className={`px-6 py-4 rounded-2xl font-black text-2xl shadow-xl flex items-center gap-2 transition-colors duration-300 ${settings.timerMode === "manual" ? 'bg-card border border-primary/20 text-text/50 text-sm' : timeLeft <= 10 ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-primary text-background'}`}>
              {settings.timerMode === "timed" ? `⏱️ ${timeLeft}` : "🏁 Süresiz"}
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 overflow-y-auto pb-6 max-h-[60vh] px-1 custom-scrollbar">
            {CATEGORIES.filter(c => settings.selectedCategories.includes(c.id)).map((cat) => (
              <div key={cat.id} className="bg-card border border-primary/20 p-3 rounded-2xl flex flex-col shadow-sm focus-within:border-primary focus-within:shadow-md transition-all">
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1.5 pl-2">{cat.label}</label>
                <input 
                  type="text" 
                  value={answers[cat.id] || ""}
                  onChange={(e) => handleInputChange(cat.id, e.target.value)}
                  placeholder={`${targetLetter} ile başlıyor...`}
                  className="w-full bg-background border border-primary/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary/50"
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          <button onClick={finishRound} className="w-full mt-auto bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg flex justify-center items-center gap-2">
            Bitirdim! <span className="text-2xl">🏁</span>
          </button>
        </div>
      )}

      {phase === "waitingRound" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full z-10">
          <div className="text-6xl mb-6 animate-spin drop-shadow-xl">⏳</div>
          <h2 className="display-font text-3xl text-primary mb-2 text-center">Cevaplar Kaydedildi!</h2>
          <p className="text-text/70 uppercase tracking-widest text-sm font-bold animate-pulse text-center">
             {playMode === "multi" ? `${targetOpponent}'un bitirmesi bekleniyor...` : "Hakem masasına geçiliyor..."}
          </p>
        </div>
      )}

      {/* YENİ: HAKEM MASASI (Kabul/İptal Tikleme Ekranı) */}
      {phase === "roundResult" && (
        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom-5 w-full max-w-md mx-auto z-10 pb-10 overflow-y-auto custom-scrollbar">
          <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2 border border-primary/20 px-4 py-1 rounded-full bg-card shadow-sm mt-2">
            Tur {currentRound} Hakem Masası
          </div>
          
          <p className="text-text/60 text-[10px] text-center mb-4 uppercase tracking-widest px-4">
             Karar sizin! Kurallara uymayan cevapların yanındaki tike basarak iptal edebilirsiniz.
          </p>

          <div className="flex items-center gap-4 mb-4">
             <span className="text-6xl font-black text-primary drop-shadow-lg">{targetLetter}</span>
          </div>

          <div className="w-full flex flex-col gap-3 mb-8 px-2">
            {CATEGORIES.filter(c => settings.selectedCategories.includes(c.id)).map(cat => {
              const myWord = (answers[cat.id] || "").trim();
              const myValid = !!myValidations[cat.id];
              
              const opWord = playMode === "multi" ? (opponentAnswers[cat.id] || "").trim() : "";
              const opValid = !!opponentValidations[cat.id];

              return (
                <div key={cat.id} className="bg-card border border-primary/20 rounded-2xl overflow-hidden shadow-md flex flex-col">
                  <div className="bg-primary/5 py-1.5 px-3 border-b border-primary/10 text-center">
                     <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{cat.label}</span>
                  </div>
                  <div className="flex divide-x divide-primary/10">
                     
                     {/* BENİM CEVABIM VE HAKEM TIKLAMASI */}
                     <div className={`flex-1 p-3 flex flex-col items-center justify-center text-center relative transition-colors ${myValid ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                        <span className="text-[8px] uppercase tracking-widest text-text/40 mb-1 font-bold">Sen</span>
                        <span className={`font-bold text-sm ${myValid ? 'text-green-400' : 'text-red-400 line-through'}`}>{myWord || "-"}</span>
                        
                        <button 
                          onClick={() => toggleValidation(true, cat.id)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full border shadow-sm transition-transform active:scale-90 ${myValid ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-red-500/20 border-red-500 text-red-500'}`}
                        >
                           {myValid ? "✅" : "❌"}
                        </button>
                     </div>

                     {/* RAKİBİN CEVABI VE HAKEM TIKLAMASI */}
                     {playMode === "multi" && (
                        <div className={`flex-1 p-3 flex flex-col items-center justify-center text-center relative transition-colors ${opValid ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                           <span className="text-[8px] uppercase tracking-widest text-text/40 mb-1 font-bold">{targetOpponent}</span>
                           <span className={`font-bold text-sm ${opValid ? 'text-green-400' : 'text-red-400 line-through'}`}>{opWord || "-"}</span>
                           
                           <button 
                             onClick={() => toggleValidation(false, cat.id)}
                             className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full border shadow-sm transition-transform active:scale-90 ${opValid ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-red-500/20 border-red-500 text-red-500'}`}
                           >
                              {opValid ? "✅" : "❌"}
                           </button>
                        </div>
                     )}

                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleNext} className="w-full mt-auto bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg sticky bottom-0">
            {currentRound < settings.rounds ? "Puanları Onayla & Tura Geç ➡️" : "Sonuçları Gör 🏆"}
          </button>
        </div>
      )}

      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full z-10">
          <div className="text-7xl mb-4 drop-shadow-lg">👑</div>
          
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">
            {playMode === "single" ? "Oyun Bitti!" :
              opponentTotalScore === 0 && myTotalScore === 0 ? "Sonuçlar..." :
              myTotalScore > opponentTotalScore ? "Kazanan Sen Oldun! 🏆" :
              myTotalScore < opponentTotalScore ? `Kazanan ${targetOpponent}! 😔` :
              "Berabere! 🤝"
            }
          </h2>
          
          <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
            Toplam {settings.rounds} turun genel skorları hesaplandı.
          </p>

          {playMode === "multi" ? (
            <div className="flex gap-4 w-full justify-center mb-6">
              <div className={`bg-card border ${myTotalScore >= opponentTotalScore ? 'border-green-500 shadow-green-500/20' : 'border-primary/20'} w-1/2 p-4 rounded-3xl shadow-xl flex flex-col items-center relative`}>
                <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-2">Sen</span>
                <h3 className="display-font text-4xl text-primary font-black">{myTotalScore}</h3>
              </div>
              
              <div className={`bg-card border ${opponentTotalScore >= myTotalScore ? 'border-green-500 shadow-green-500/20' : 'border-primary/20'} w-1/2 p-4 rounded-3xl shadow-xl flex flex-col items-center relative`}>
                <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-2">{targetOpponent}</span>
                <h3 className="display-font text-4xl text-primary font-black">{opponentTotalScore}</h3>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-primary/30 w-full p-8 rounded-[32px] shadow-2xl flex flex-col items-center mb-6">
              <h3 className="display-font text-6xl text-primary font-black drop-shadow-sm">{myTotalScore}</h3>
              <span className="text-xs uppercase tracking-widest text-text/50 mt-3 font-bold">Toplam Puanın</span>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full mt-4">
            <button onClick={returnToLobby} className="w-full bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg">
              🔄 Tekrar Oyna (Lobiye Dön)
            </button>
            <button onClick={returnToMenu} className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center">
              ⬅️ Oyun Modu Seçimine Dön
            </button>
          </div>
        </div>
      )}
    </main>
  );
}