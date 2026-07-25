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
  const [phase, setPhase] = useState<"modeSelect" | "settings" | "selectSecret" | "playing" | "finalResult">("modeSelect");
  
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isMeReady, setIsMeReady] = useState(false);

  const [myFlippedCards, setMyFlippedCards] = useState<boolean[]>(Array(30).fill(false));
  const [opponentFlippedCards, setOpponentFlippedCards] = useState<boolean[]>(Array(30).fill(false));
  
  const [mySecretCharacter, setMySecretCharacter] = useState<number | null>(null);
  const [isSecretLocked, setIsSecretLocked] = useState<boolean>(false); // YENİ: Seçimi kilitleme durumu

  const [winner, setWinner] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<number | null>(null);
  const [isGuessMode, setIsGuessMode] = useState<boolean>(false);

  const targetOpponent = currentUser === "Emircan" ? "Efsun" : "Emircan";
  const myPlayerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
  const opPlayerField = currentUser === "Emircan" ? "p2_state" : "p1_state";

  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    CHARACTERS.forEach(char => {
      const img = new Image();
      img.src = char.image;
    });
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
  }, []);

  useEffect(() => {
    const checkLobbyStatus = (data: any) => {
      const opState = data[opPlayerField];
      const myState = data[myPlayerField];
      const currentPhase = phaseRef.current;

      setIsOpponentReady(opState?.ready || false);
      setIsSecretLocked(myState?.secretSelected || false);

      if (data.status === 'waiting' && (currentPhase === 'finalResult' || currentPhase === 'playing' || currentPhase === 'selectSecret')) {
         setPhase('settings');
         setIsMeReady(false);
         setWinner(null);
         setMySecretCharacter(null);
         setIsSecretLocked(false);
         setMyFlippedCards(Array(30).fill(false));
         setOpponentFlippedCards(Array(30).fill(false));
         setIsGuessMode(false);
      }

      if (data.status === 'selecting' && currentPhase === 'settings') {
         setPhase('selectSecret');
         playSound("click");
      }

      if (data.status === 'playing') {
        if (currentPhase === 'selectSecret') {
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
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) checkLobbyStatus(data);
    };

    fetchInitialLobby();

    const channel = supabase
      .channel('lobby-channel-guess')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_state', filter: 'id=eq.1' }, (payload) => {
        checkLobbyStatus(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, myPlayerField, opPlayerField]); 

  const joinLobby = async () => {
    setPhase("settings");
    setIsMeReady(false);
    setIsSecretLocked(false);
    playSound("click");

    const updateData: any = { [myPlayerField]: { joined: true, ready: false, flipped: Array(30).fill(false), secret: null, secretSelected: false } };
    if (currentUser === "Emircan") updateData.status = 'waiting';

    const { data: existing } = await supabase.from('multiplayer_state').select('id').eq('id', 1).single();
    if (!existing) {
        await supabase.from('multiplayer_state').insert({
            id: 1,
            status: 'waiting',
            p1_state: { joined: currentUser === "Emircan", ready: false },
            p2_state: { joined: currentUser !== "Emircan", ready: false }
        });
    } else {
        await supabase.from('multiplayer_state').update(updateData).eq('id', 1);
    }
  };

  const returnToMenu = async () => {
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
    setIsSecretLocked(false);
  };

  const toggleReady = async () => {
    playSound("click");
    const newReadyState = !isMeReady;
    setIsMeReady(newReadyState);

    const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
    if (data) {
       await supabase.from('multiplayer_state').update({
          [myPlayerField]: { ...data[myPlayerField], joined: true, ready: newReadyState }
       }).eq('id', 1);
    }
  };

  const startSelectionPhase = async () => {
    playSound("click");
    await supabase.from('multiplayer_state').update({
      status: 'selecting',
      shared_data: { winner: null, game_type: 'guess_who' },
      p1_state: { joined: true, ready: true, flipped: Array(30).fill(false), secret: null, secretSelected: false },
      p2_state: { joined: true, ready: true, flipped: Array(30).fill(false), secret: null, secretSelected: false }
    }).eq('id', 1);
  };

  // YENİ: Sadece yerel olarak seçer, kilitlenmez
  const handleSelectSecret = (index: number) => {
    if (isSecretLocked) return;
    playSound("click");
    setMySecretCharacter(index);
  };

  // YENİ: Kararını verdiğinde butona basar ve veritabanına kaydeder
  const confirmSecretSelection = async () => {
    if (mySecretCharacter === null) return;
    playSound("success");
    setIsSecretLocked(true); // Anında kilitli UI

    const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
    if (data) {
        const isOpponentSelected = data[opPlayerField]?.secretSelected;
        
        await supabase.from('multiplayer_state').update({
            [myPlayerField]: { ...data[myPlayerField], secret: mySecretCharacter, secretSelected: true },
            // Diğer oyuncu da seçmişse oyunu başlat
            ...(isOpponentSelected ? { status: 'playing' } : {}) 
        }).eq('id', 1);
    }
  };

  const handleCardClick = async (index: number) => {
    if (myFlippedCards[index]) return;

    if (isGuessMode) {
       setIsGuessMode(false); 
       const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
       if (data) {
           const opponentSecret = data[opPlayerField].secret;
           if (index === opponentSecret) {
               playSound("success");
               await supabase.from('multiplayer_state').update({ status: 'game_over', shared_data: { winner: currentUser } }).eq('id', 1);
           } else {
               playSound("over");
               await supabase.from('multiplayer_state').update({ status: 'game_over', shared_data: { winner: targetOpponent } }).eq('id', 1);
           }
       }
    } else {
       playSound("click"); 
       const newFlipped = [...myFlippedCards];
       newFlipped[index] = true;
       setMyFlippedCards(newFlipped); 

       const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
       if (data) {
           await supabase.from('multiplayer_state').update({ [myPlayerField]: { ...data[myPlayerField], flipped: newFlipped } }).eq('id', 1);
       }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
         supabase.from('multiplayer_state').update({ [myPlayerField]: { joined: false, ready: false } }).eq('id', 1).then();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [myPlayerField]);

  const renderOpponentCard = (index: number, isFlipped: boolean) => {
    return (
      <div key={`op_${index}`} style={{ perspective: '800px' }} className="w-8 h-12 sm:w-12 sm:h-16 relative">
        <div className="w-full h-full absolute top-0 left-0 transition-transform duration-500 ease-out origin-bottom border-2 border-red-700 rounded-md bg-red-600 shadow-lg flex items-center justify-center" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateX(90deg)' : 'rotateX(-10deg)' }}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
          <span className="text-white font-black text-xs opacity-50">?</span>
        </div>
      </div>
    );
  };

  const renderMyCard = (char: typeof CHARACTERS[0], index: number, isFlipped: boolean) => {
    return (
      <div key={`my_${char.id}`} style={{ perspective: '800px' }} className="w-12 h-16 sm:w-16 sm:h-24 relative cursor-pointer group" onClick={() => handleCardClick(index)}>
        <div 
          className="w-full h-full absolute bottom-0 left-0 transition-transform duration-500 ease-out origin-bottom border-[3px] rounded-lg shadow-xl"
          style={{ 
            borderColor: isGuessMode && !isFlipped ? '#ef4444' : '#2563eb',
            boxShadow: isGuessMode && !isFlipped ? '0 0 15px rgba(239,68,68,0.5)' : '',
            transformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateX(-90deg)' : 'rotateX(15deg)' 
          }}
        >
          <div className="absolute inset-0 bg-blue-100 rounded-md overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
             <img src={char.image} alt="character" className="w-full h-full object-cover pointer-events-none" />
             {isFlipped && <div className="absolute inset-0 bg-black/60"></div>}
             
             {!isFlipped && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); setInspectedCard(index); playSound("click"); }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 border border-white/30"
                 >
                    🔍
                 </button>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-col min-h-screen transition-colors duration-500 relative bg-[#1e293b]">
      <div className="absolute inset-0 pointer-events-none opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

      {/* İNCELEME (ZOOM) MODALI - EN ÜST KATMAN */}
      {inspectedCard !== null && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setInspectedCard(null)}>
            <div className="relative max-w-sm w-full bg-slate-900 p-2 rounded-2xl border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200">
               <img src={CHARACTERS[inspectedCard].image} alt="inspect" className="w-full h-auto rounded-xl" />
               <p className="text-center text-white/50 text-xs mt-2 uppercase tracking-widest font-bold">Kapatmak için ekrana dokun</p>
            </div>
         </div>
      )}

      {/* YENİ: EKRANIN EN ÜSTÜNE SABİTLENEN DİKKAT UYARISI */}
      {isGuessMode && phase === "playing" && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-red-600/95 backdrop-blur-xl text-white px-8 py-6 rounded-3xl border-2 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.8)] text-center animate-in zoom-in-95">
               <p className="font-black uppercase tracking-widest text-3xl drop-shadow-md mb-2">DİKKAT!</p>
               <p className="text-sm font-bold opacity-90 leading-relaxed">Aşağıdan hedefini seç.<br/>Yanlış bilirsen <span className="underline decoration-2 underline-offset-2">kaybedersin!</span></p>
            </div>
         </div>
      )}

      {/* KARAKTER SEÇİM EKRANI */}
      {phase === "selectSecret" && (
        <div className="flex-1 flex flex-col items-center py-10 px-4 relative z-10 w-full max-w-4xl mx-auto h-[100dvh] overflow-y-auto">
           <div className="text-center mb-6 bg-slate-900/80 p-4 rounded-3xl border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] sticky top-0 z-20 backdrop-blur-md flex flex-col items-center">
              <h2 className="display-font text-3xl text-yellow-400 font-black tracking-widest mb-1">KİMLİĞİNİ SEÇ</h2>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-3">
                 {isSecretLocked ? `${targetOpponent}'un seçimi bekleniyor...` : "Oyun boyunca gizleyeceğin karakteri belirle."}
              </p>
              
              {/* ONAYLA BUTONU */}
              {mySecretCharacter !== null && !isSecretLocked && (
                 <button onClick={confirmSecretSelection} className="bg-green-500 text-white px-6 py-2 rounded-xl font-black tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-pulse hover:scale-105 border-2 border-green-300 transition-transform">
                    SEÇİMİ ONAYLA
                 </button>
              )}
           </div>
           
           <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 sm:gap-4 pb-20">
              {CHARACTERS.map((char, index) => (
                 <div 
                    key={`sel_${char.id}`} 
                    onClick={() => handleSelectSecret(index)}
                    className={`w-14 h-20 sm:w-20 sm:h-28 rounded-xl overflow-hidden transition-all duration-300 border-[3px] shadow-lg
                       ${mySecretCharacter === index ? 'border-green-500 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.6)] z-10 relative' : 
                         isSecretLocked ? 'border-slate-800 opacity-30 grayscale cursor-not-allowed' : 'border-slate-600 hover:border-yellow-400 hover:scale-105 cursor-pointer'
                       }
                    `}
                 >
                    <img src={char.image} alt="character" className="w-full h-full object-cover" />
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* OYUN EKRANI */}
      {phase === "playing" && (
        <div className="flex-1 flex flex-col justify-between w-full h-[100dvh] overflow-hidden py-2 sm:py-4 px-2 z-10">
            {/* EFSUN'UN TAHTASI */}
            <div className="w-full flex flex-col items-center gap-2 mt-2 sm:mt-4 relative">
                <div className="bg-red-600/20 border border-red-500/50 px-6 py-2 rounded-xl backdrop-blur-sm shadow-[0_10px_30px_rgba(220,38,38,0.3)]">
                    <span className="text-red-400 font-black tracking-widest uppercase text-sm">
                        {targetOpponent}'un Tahtası
                    </span>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:gap-4 mt-2 sm:mt-4 p-3 sm:p-4 bg-red-900/40 rounded-2xl border-t-4 border-red-800" style={{ transform: 'rotateX(10deg)', perspective: '1000px' }}>
                    {CHARACTERS.map((_, i) => renderOpponentCard(i, opponentFlippedCards[i]))}
                </div>
            </div>

            {/* TAHMİN ET BUTONU */}
            <div className="w-full flex items-center justify-center my-2 relative z-20">
                <button 
                  onClick={() => setIsGuessMode(!isGuessMode)} 
                  className={`px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all duration-300 shadow-xl border-4 
                    ${isGuessMode ? 'bg-red-600 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse' 
                                  : 'bg-yellow-500 text-slate-900 border-yellow-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                    }`}
                >
                    {isGuessMode ? "❌ İPTAL ET" : "🎯 TAHMİN ET"}
                </button>
            </div>

            {/* SENİN TAHTAN */}
            <div className="w-full flex flex-col items-center gap-2 mb-2 sm:mb-4 relative z-30">
                <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 bg-blue-900/40 rounded-2xl border-b-4 border-blue-800 shadow-[0_-10px_30px_rgba(37,99,235,0.2)]">
                    {CHARACTERS.map((char, i) => renderMyCard(char, i, myFlippedCards[i]))}
                </div>
                
                <div className="flex items-center justify-between w-full max-w-sm px-4 mt-2">
                    <span className="bg-blue-600/20 border border-blue-500/50 px-4 py-1 rounded-xl backdrop-blur-sm text-blue-400 font-black tracking-widest uppercase text-xs hidden sm:block">
                        Senin Tahtan
                    </span>
                    <div className="flex items-center gap-3 bg-black/60 border border-white/20 p-2 rounded-xl shadow-2xl ml-auto">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest text-right leading-tight">Senin<br/>Gizli<br/>Karakterin</span>
                        <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-md overflow-hidden border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] cursor-pointer hover:scale-110 transition-transform" onClick={() => mySecretCharacter !== null && setInspectedCard(mySecretCharacter)}>
                           {mySecretCharacter !== null && <img src={CHARACTERS[mySecretCharacter].image} alt="secret" className="w-full h-full object-cover" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* LOBİ, AYARLAR VE SONUÇ EKRANLARI */}
      {(phase === "modeSelect" || phase === "settings" || phase === "finalResult") && (
        <div className="p-5 animate-in fade-in duration-500 flex flex-col h-full items-center justify-center relative z-10 w-full max-w-md mx-auto">
            {phase !== "finalResult" && (
            <div className="absolute top-5 left-5">
                <Link className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm" href="/games">
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
                    <button onClick={startSelectionPhase} disabled={!isOpponentReady || !isMeReady} className={`w-full mt-2 p-5 rounded-2xl shadow-xl transition-all duration-300 font-black text-lg tracking-widest uppercase ${isOpponentReady && isMeReady ? 'bg-blue-600 text-white hover:scale-[1.02] ring-4 ring-blue-400/30' : 'bg-background border-2 border-primary/20 text-primary/40 cursor-not-allowed'}`}>
                      {isOpponentReady && isMeReady ? "KARAKTER SEÇİMİNE GEÇ 🚀" : "EFSUN BEKLENİYOR..."}
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
                  <div className="text-7xl drop-shadow-lg">{winner === currentUser ? "👑" : "💀"}</div>
                  <h2 className="display-font text-4xl text-white mb-2 font-black">
                    {winner === currentUser ? "DEDEKTİF SENSİN!" : "ÖNCE O BULDU..."}
                  </h2>
                  <div className="flex flex-col gap-3 w-full mt-8">
                    <button onClick={returnToMenu} className="w-full bg-blue-600 border border-blue-400 text-white p-4 rounded-2xl shadow-sm hover:scale-[1.02] transition-all font-bold text-lg">
                      🔄 Yeni Dosya Aç (Lobiye Dön)
                    </button>
                    <Link className="w-full bg-card border border-primary/20 text-text/80 p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center" href="/games">
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