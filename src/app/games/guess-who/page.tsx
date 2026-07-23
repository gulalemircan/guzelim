"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

const CHARACTERS = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  image: `/guess-who/${i + 1}.jpg`
}));

export default function GuessWhoPage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [phase, setPhase] = useState<"modeSelect" | "settings" | "playing" | "finalResult">("modeSelect");
  
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isMeReady, setIsMeReady] = useState(false);

  const [myFlippedCards, setMyFlippedCards] = useState<boolean[]>(Array(30).fill(false));
  const [opponentFlippedCards, setOpponentFlippedCards] = useState<boolean[]>(Array(30).fill(false));
  const [mySecretCharacter, setMySecretCharacter] = useState<number | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  const targetOpponent = currentUser === "Emircan" ? "Efsun" : "Emircan";

  // Renk Hafızası Oyunundaki Kusursuz "Ref" Mimarisi
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
  }, []);

  useEffect(() => {
    const checkLobbyStatus = (data: any) => {
      // Kimin kim olduğunu gelen verinin içinde dinamik anlıyoruz
      const opState = currentUser === "Emircan" ? data.p2_state : data.p1_state;
      const myState = currentUser === "Emircan" ? data.p1_state : data.p2_state;
      const currentPhase = phaseRef.current;

      setIsOpponentReady(opState?.ready || false);

      if (data.status === 'waiting' && (currentPhase === 'finalResult' || currentPhase === 'playing')) {
         setPhase('settings');
         setIsMeReady(false);
         setWinner(null);
         setMySecretCharacter(null);
      }

      if (data.status === 'playing') {
        if (currentPhase === 'settings') {
           setPhase('playing');
           playSound("start");
        }
        setMyFlippedCards(myState?.flipped || Array(30).fill(false));
        setOpponentFlippedCards(opState?.flipped || Array(30).fill(false));
        setMySecretCharacter(myState?.secret ?? null);
      }

      if (data.status === 'game_over' && currentPhase !== 'finalResult') {
          setWinner(data.shared_data?.winner || null);
          setPhase('finalResult');
          playSound("over");
      }
    };

    const fetchInitialLobby = async () => {
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 2).single();
      if (data) checkLobbyStatus(data);
    };

    fetchInitialLobby();

    const channel = supabase
      .channel('lobby-channel-guess')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_state', filter: 'id=eq.2' }, (payload) => {
        checkLobbyStatus(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]); 

  const joinLobby = async () => {
    setPhase("settings");
    setIsMeReady(false);
    playSound("click");

    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    const updateData: any = { [playerField]: { joined: true, ready: false, flipped: Array(30).fill(false), secret: null } };
    
    // Eski oyunumuzdaki gibi sadece Emircan status'u beklemeye alır
    if (currentUser === "Emircan") updateData.status = 'waiting';

    const { data: existing } = await supabase.from('multiplayer_state').select('id').eq('id', 2).single();
    if (!existing) {
        await supabase.from('multiplayer_state').insert({
            id: 2,
            status: 'waiting',
            p1_state: { joined: currentUser === "Emircan", ready: false },
            p2_state: { joined: currentUser !== "Emircan", ready: false }
        });
    } else {
        await supabase.from('multiplayer_state').update(updateData).eq('id', 2);
    }
  };

  const returnToMenu = async () => {
    playSound("click");
    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    await supabase.from('multiplayer_state').update({
       status: 'waiting',
       [playerField]: { joined: false, ready: false }
    }).eq('id', 2);
    setPhase("modeSelect");
    setIsMeReady(false);
  };

  const toggleReady = async () => {
    playSound("click");
    const newReadyState = !isMeReady;
    setIsMeReady(newReadyState); // Anında Yeşil UI (Optimistic)

    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 2).single();
    if (data) {
       await supabase.from('multiplayer_state').update({
          [playerField]: { ...data[playerField], joined: true, ready: newReadyState }
       }).eq('id', 2);
    }
  };

  const startGame = async () => {
    playSound("click");
    const p1Secret = Math.floor(Math.random() * 30);
    let p2Secret = Math.floor(Math.random() * 30);
    while(p2Secret === p1Secret) p2Secret = Math.floor(Math.random() * 30);

    await supabase.from('multiplayer_state').update({
      status: 'playing',
      shared_data: { winner: null },
      p1_state: { joined: true, ready: true, flipped: Array(30).fill(false), secret: p1Secret },
      p2_state: { joined: true, ready: true, flipped: Array(30).fill(false), secret: p2Secret }
    }).eq('id', 2);
  };

  const flipMyCard = async (index: number) => {
    if (myFlippedCards[index]) return;
    playSound("click"); 

    const newFlipped = [...myFlippedCards];
    newFlipped[index] = true;
    setMyFlippedCards(newFlipped); 

    const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
    const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 2).single();
    if (data) {
        await supabase.from('multiplayer_state').update({
            [playerField]: { ...data[playerField], flipped: newFlipped }
        }).eq('id', 2);
    }
  };

  const declareWin = async () => {
      playSound("success");
      await supabase.from('multiplayer_state').update({
          status: 'game_over',
          shared_data: { winner: currentUser }
      }).eq('id', 2);
  };

  // Sekme Kapanırsa Odadan Düşme Olayı (Renk Hafızası ile aynı)
  useEffect(() => {
    const handleBeforeUnload = () => {
         const playerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
         supabase.from('multiplayer_state').update({ [playerField]: { joined: false, ready: false } }).eq('id', 2).then();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentUser]);

  const renderOpponentCard = (index: number, isFlipped: boolean) => {
    return (
      <div key={`op_${index}`} style={{ perspective: '800px' }} className="w-8 h-12 sm:w-12 sm:h-16 relative">
        <div 
          className="w-full h-full absolute top-0 left-0 transition-transform duration-500 ease-out origin-bottom border-2 border-red-700 rounded-md bg-red-600 shadow-lg flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateX(90deg)' : 'rotateX(-10deg)' }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
          <span className="text-white font-black text-xs opacity-50">?</span>
        </div>
      </div>
    );
  };

  const renderMyCard = (char: typeof CHARACTERS[0], index: number, isFlipped: boolean) => {
    return (
      <div key={`my_${char.id}`} style={{ perspective: '800px' }} className="w-12 h-16 sm:w-16 sm:h-24 relative cursor-pointer" onClick={() => flipMyCard(index)}>
        <div 
          className="w-full h-full absolute bottom-0 left-0 transition-transform duration-500 ease-out origin-bottom border-[3px] border-blue-600 rounded-lg shadow-xl"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateX(-90deg)' : 'rotateX(15deg)' }}
        >
          <div className="absolute inset-0 bg-blue-100 rounded-md overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
             <img src={char.image} alt="character" className="w-full h-full object-cover pointer-events-none" />
             {isFlipped && <div className="absolute inset-0 bg-black/50"></div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-col min-h-screen transition-colors duration-500 relative bg-[#1e293b]">
      <div className="absolute inset-0 pointer-events-none opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

      {phase === "playing" ? (
        <div className="flex-1 flex flex-col justify-between w-full h-[100dvh] overflow-hidden py-4 px-2 z-10">
            <div className="w-full flex flex-col items-center gap-2 mt-4 relative">
                <div className="bg-red-600/20 border border-red-500/50 px-6 py-2 rounded-xl backdrop-blur-sm shadow-[0_10px_30px_rgba(220,38,38,0.3)]">
                    <span className="text-red-400 font-black tracking-widest uppercase text-sm">
                        {targetOpponent}'un Tahtası
                    </span>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:gap-4 mt-4 p-4 bg-red-900/40 rounded-2xl border-t-4 border-red-800" style={{ transform: 'rotateX(10deg)', perspective: '1000px' }}>
                    {CHARACTERS.map((_, i) => renderOpponentCard(i, opponentFlippedCards[i]))}
                </div>
            </div>

            <div className="w-full flex items-center justify-center my-2 relative z-20">
                <button onClick={declareWin} className="bg-green-500 text-white font-black px-8 py-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse hover:scale-110 active:scale-95 transition-transform border-4 border-green-300">
                    🔍 KİM OLDUĞUNU BULDUM!
                </button>
            </div>

            <div className="w-full flex flex-col items-center gap-2 mb-4 relative z-30">
                <div className="grid grid-cols-6 gap-2 sm:gap-4 p-4 bg-blue-900/40 rounded-2xl border-b-4 border-blue-800 shadow-[0_-10px_30px_rgba(37,99,235,0.2)]">
                    {CHARACTERS.map((char, i) => renderMyCard(char, i, myFlippedCards[i]))}
                </div>
                <div className="flex items-center justify-between w-full max-w-sm px-4 mt-2">
                    <span className="bg-blue-600/20 border border-blue-500/50 px-4 py-1 rounded-xl backdrop-blur-sm text-blue-400 font-black tracking-widest uppercase text-xs">
                        Senin Tahtan
                    </span>
                    <div className="flex items-center gap-3 bg-black/60 border border-white/20 p-2 rounded-xl shadow-2xl">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest text-right leading-tight">Senin<br/>Gizli<br/>Karakterin</span>
                        <div className="w-12 h-16 rounded-md overflow-hidden border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                           {mySecretCharacter !== null && <img src={CHARACTERS[mySecretCharacter].image} alt="secret" className="w-full h-full object-cover" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="p-5 animate-in fade-in duration-500 flex flex-col h-full items-center justify-center relative z-10 w-full max-w-md mx-auto">
            {phase !== "finalResult" && (
            <div className="absolute top-5 left-5">
                <Link href="/games" className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
                  <span>←</span> Oyunlar
                </Link>
            </div>
            )}

            {phase === "modeSelect" && (
                <div className="flex flex-col items-center justify-center gap-8 w-full mt-10">
                  <div className="text-center mb-2">
                    <div className="text-7xl drop-shadow-xl mb-4 animate-bounce">🕵️‍♂️</div>
                    <h2 className="display-font text-4xl text-white font-black tracking-widest drop-shadow-lg">BİL BAKALIM KİM?</h2>
                    <p className="text-text/70 text-sm mt-2 font-medium tracking-wide">30 Efsane, Tek Hedef.</p>
                  </div>
                  <button onClick={joinLobby} className="w-full bg-blue-600 text-white p-6 rounded-[32px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center gap-3 font-black tracking-widest uppercase text-lg border-2 border-blue-400">
                    Sorguya Başla
                  </button>
                </div>
            )}

            {phase === "settings" && (
                <div className="flex flex-col gap-6 w-full mt-10 relative">
                  
                  <div className="text-center mb-2">
                    <div className="text-5xl mb-2">⚙️</div>
                    <h2 className="display-font text-3xl text-primary">Sorgu Odası</h2>
                  </div>
                  <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6 mt-4">
                      <p className="text-text/60 text-[10px] font-bold tracking-widest uppercase text-center leading-relaxed px-4">
                          Karşı tarafın karakterini bulana kadar sorular sor. Gözlüklü mü? Uçuyor mu? 
                      </p>
                      <button onClick={toggleReady} className={`w-full py-5 rounded-[24px] font-black text-xl tracking-widest uppercase shadow-2xl transition-all duration-300 ${isMeReady ? 'bg-green-500 text-white' : 'bg-card border-4 border-primary text-primary hover:bg-primary hover:text-background'}`}>
                        {isMeReady ? "👍 HAZIRSIN" : "HAZIRIM"}
                      </button>
                      
                      <div className="flex gap-6 mt-2 text-[11px] font-bold tracking-widest uppercase text-text/50">
                          <span className={isMeReady ? "text-green-500" : ""}>{currentUser}: {isMeReady ? "Hazır" : "Bekliyor"}</span>
                          <span className={isOpponentReady ? "text-green-500" : ""}>{targetOpponent}: {isOpponentReady ? "Hazır" : "Bekliyor"}</span>
                      </div>
                  </div>
                  
                  {currentUser === "Emircan" ? (
                    <button onClick={startGame} disabled={!isOpponentReady || !isMeReady} className={`w-full mt-2 p-5 rounded-2xl shadow-xl transition-all duration-300 font-black text-lg tracking-widest uppercase ${isOpponentReady && isMeReady ? 'bg-blue-600 text-white hover:scale-[1.02] ring-4 ring-blue-400/30' : 'bg-background border-2 border-primary/20 text-primary/40 cursor-not-allowed'}`}>
                      {isOpponentReady && isMeReady ? "PANOLARI AÇ 🚀" : "EFSUN BEKLENİYOR..."}
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-text/50 uppercase tracking-widest mt-2 animate-pulse">
                        Emircan'ın başlatması bekleniyor...
                    </div>
                  )}

                  <button onClick={returnToMenu} className="text-[10px] text-red-500 uppercase tracking-widest font-bold mt-2 hover:underline text-center w-full">
                    Odadan Çık
                  </button>
                </div>
            )}

            {phase === "finalResult" && (
                <div className="flex flex-col items-center justify-center gap-6 w-full mt-20 text-center">
                  <div className="text-7xl drop-shadow-lg">👑</div>
                  <h2 className="display-font text-4xl text-white mb-2 font-black">
                    {winner === currentUser ? "DEDEKTİF SENSİN!" : "ÖNCE O BULDU..."}
                  </h2>
                  <div className="flex flex-col gap-3 w-full mt-8">
                    <button onClick={returnToMenu} className="w-full bg-blue-600 border border-blue-400 text-white p-4 rounded-2xl shadow-sm hover:scale-[1.02] transition-all font-bold text-lg">
                      🔄 Yeni Dosya Aç (Lobiye Dön)
                    </button>
                    <Link href="/games" className="w-full bg-card border border-primary/20 text-text/80 p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center">
                      ⬅️ Oyunlar Menüsü
                    </Link>
                  </div>
                </div>
            )}
        </div>
      )}
    </main>
  );
}