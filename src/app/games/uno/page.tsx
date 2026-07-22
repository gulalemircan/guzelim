"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

// --- TİPLER VE KART MOTORU ---
type Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
type Value = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'skip'|'reverse'|'draw2'|'wild'|'draw4';
interface Card { id: string, color: Color, value: Value }

const COLORS = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  wild: "bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500"
};

const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
  let idCounter = 0;

  colors.forEach(color => {
    deck.push({ id: `c_${idCounter++}`, color, value: '0' });
    for (let i = 1; i <= 9; i++) {
      deck.push({ id: `c_${idCounter++}`, color, value: i.toString() as Value });
      deck.push({ id: `c_${idCounter++}`, color, value: i.toString() as Value });
    }
    ['skip', 'reverse', 'draw2'].forEach(val => {
      deck.push({ id: `c_${idCounter++}`, color, value: val as Value });
      deck.push({ id: `c_${idCounter++}`, color, value: val as Value });
    });
  });

  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${idCounter++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `c_${idCounter++}`, color: 'wild', value: 'draw4' });
  }

  return deck.sort(() => Math.random() - 0.5);
};

export default function UnoPage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [phase, setPhase] = useState<"modeSelect" | "settings" | "playing" | "finalResult">("modeSelect");
  
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isMeReady, setIsMeReady] = useState(false);
  const targetOpponent = currentUser === "Emircan" ? "Efsun" : "Emircan";

  // UNO State
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [opponentHandCount, setOpponentHandCount] = useState(7);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [currentColor, setCurrentColor] = useState<Color>("red");
  const [pendingAction, setPendingAction] = useState<"none" | "choosing_color">("none");
  const [myUnoSaid, setMyUnoSaid] = useState(false);
  const [opponentUnoSaid, setOpponentUnoSaid] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Transient Events (Emoji & Uno Bildirimi)
  const [reaction, setReaction] = useState<string | null>(null);
  const [unoNotification, setUnoNotification] = useState<string | null>(null);
  const lastEventIdRef = useRef(0);

  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [isSaved, setIsSaved] = useState(false);
  
  const myPlayerField = currentUser === "Emircan" ? "p1_state" : "p2_state";
  const opPlayerField = currentUser === "Emircan" ? "p2_state" : "p1_state";

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('game_scores').select('*').eq('game_name', 'uno_win');
    if (data) {
      const emircanWins = data.filter(d => d.player_name === 'Emircan').length;
      const efsunWins = data.filter(d => d.player_name === 'Efsun').length;
      setLeaderboard({ emircan: emircanWins, efsun: efsunWins });
    }
  };

  useEffect(() => {
    const checkLobbyStatus = (data: any) => {
      const myState = data[myPlayerField];
      const opState = data[opPlayerField];
      
      setIsOpponentReady(opState?.ready || false);

      if (data.status === 'waiting' && phase !== 'modeSelect' && phase !== 'settings') {
         setPhase('settings');
         setIsMeReady(false);
         setIsSaved(false);
         setWinner(null);
      }

      if (data.status === 'playing') {
          if (phase === 'settings') {
             setPhase('playing');
             playSound("start");
          }
          setMyHand(myState?.hand || []);
          setMyUnoSaid(myState?.unoSaid || false);
          
          setOpponentHandCount(opState?.hand?.length || 0);
          setOpponentUnoSaid(opState?.unoSaid || false);

          setDiscardPile(data.shared_data?.discardPile || []);
          setCurrentTurn(data.shared_data?.currentTurn || "");
          setCurrentColor(data.shared_data?.currentColor || "red");
          setPendingAction(data.shared_data?.pendingAction || "none");

          if (data.shared_data?.lastEvent && data.shared_data.lastEvent.id !== lastEventIdRef.current) {
              lastEventIdRef.current = data.shared_data.lastEvent.id;
              const evt = data.shared_data.lastEvent;
              
              if (evt.type === 'reaction') {
                  setReaction(evt.payload);
                  playSound("tick");
                  setTimeout(() => setReaction(null), 2000);
              } else if (evt.type === 'uno') {
                  setUnoNotification(`${evt.payload} UNO DEDİ!`);
                  playSound("success");
                  setTimeout(() => setUnoNotification(null), 3000);
              }
          }
      }

      if (data.status === 'game_over') {
          setWinner(data.shared_data?.winner || null);
          if (phase !== 'finalResult') {
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
      .channel('lobby-channel-uno')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_state', filter: 'id=eq.1' }, (payload) => {
        checkLobbyStatus(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, phase, myPlayerField, opPlayerField]);

  const joinLobby = async () => {
    setPhase("settings");
    setIsMeReady(false);
    playSound("click");
    await supabase.from('multiplayer_state').update({ 
        [myPlayerField]: { joined: true, ready: false },
        ...(currentUser === "Emircan" ? { status: 'waiting' } : {}) 
    }).eq('id', 1);
  };

  const toggleReady = async () => {
    playSound("click");
    const newReadyState = !isMeReady;
    setIsMeReady(newReadyState);
    await supabase.from('multiplayer_state').update({
      [myPlayerField]: { joined: true, ready: newReadyState }
    }).eq('id', 1);
  };

  const startGame = async () => {
    playSound("click");
    let deck = generateDeck();
    
    let firstCard = deck.pop()!;
    while (['skip', 'reverse', 'draw2', 'wild', 'draw4'].includes(firstCard.value)) {
        deck.unshift(firstCard);
        firstCard = deck.pop()!;
    }

    const p1Hand = deck.splice(-7);
    const p2Hand = deck.splice(-7);

    await supabase.from('multiplayer_state').update({
      status: 'playing',
      shared_data: { 
          drawPile: deck, 
          discardPile: [firstCard], 
          currentTurn: "Efsun",
          currentColor: firstCard.color,
          pendingAction: "none",
          lastEvent: null, 
          winner: null
      },
      p1_state: { joined: true, ready: true, hand: p1Hand, unoSaid: false },
      p2_state: { joined: true, ready: true, hand: p2Hand, unoSaid: false }
    }).eq('id', 1);
  };

  const handlePlayCard = async (cardIndex: number) => {
      if (currentTurn !== currentUser || pendingAction !== "none") return;

      const cardToPlay = myHand[cardIndex];
      const topCard = discardPile[discardPile.length - 1];

      const isValid = cardToPlay.color === 'wild' || 
                      cardToPlay.color === currentColor || 
                      cardToPlay.value === topCard.value;

      if (!isValid) {
          playSound("error");
          return;
      }

      playSound("click");

      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (!data) return;

      const newHand = [...myHand];
      newHand.splice(cardIndex, 1);
      
      let nextTurn = targetOpponent;
      let newPendingAction = "none";
      let drawPile = [...data.shared_data.drawPile];
      let opHand = [...data[opPlayerField].hand];

      if (newHand.length === 0) {
          await supabase.from('multiplayer_state').update({
              status: 'game_over',
              shared_data: { ...data.shared_data, winner: currentUser },
              [myPlayerField]: { ...data[myPlayerField], hand: newHand }
          }).eq('id', 1);
          return;
      }

      if (cardToPlay.value === 'skip' || cardToPlay.value === 'reverse') {
          nextTurn = currentUser; 
      } 
      else if (cardToPlay.value === 'draw2') {
          if (drawPile.length >= 2) {
             opHand.push(drawPile.pop()!);
             opHand.push(drawPile.pop()!);
          }
          nextTurn = currentUser;
      }
      else if (cardToPlay.value === 'wild') {
          newPendingAction = "choosing_color";
          nextTurn = currentUser; 
      }
      else if (cardToPlay.value === 'draw4') {
          if (drawPile.length >= 4) {
             opHand.push(drawPile.pop()!);
             opHand.push(drawPile.pop()!);
             opHand.push(drawPile.pop()!);
             opHand.push(drawPile.pop()!);
          }
          newPendingAction = "choosing_color";
          nextTurn = currentUser; 
      }

      let unoState = myUnoSaid;
      if (newHand.length > 1) unoState = false; 

      await supabase.from('multiplayer_state').update({
          shared_data: { 
              ...data.shared_data, 
              discardPile: [...data.shared_data.discardPile, cardToPlay],
              drawPile: drawPile,
              currentTurn: nextTurn,
              currentColor: cardToPlay.color !== 'wild' ? cardToPlay.color : currentColor,
              pendingAction: newPendingAction
          },
          [myPlayerField]: { ...data[myPlayerField], hand: newHand, unoSaid: unoState },
          [opPlayerField]: { ...data[opPlayerField], hand: opHand }
      }).eq('id', 1);
  };

  const handleDrawCard = async () => {
      if (currentTurn !== currentUser || pendingAction !== "none") return;
      playSound("memory_tick");

      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (!data || data.shared_data.drawPile.length === 0) return;

      let drawPile = [...data.shared_data.drawPile];
      const drawnCard = drawPile.pop()!;
      const newHand = [...myHand, drawnCard];

      await supabase.from('multiplayer_state').update({
          shared_data: { 
              ...data.shared_data, 
              drawPile: drawPile,
              currentTurn: targetOpponent 
          },
          [myPlayerField]: { ...data[myPlayerField], hand: newHand, unoSaid: false }
      }).eq('id', 1);
  };

  const handleColorSelect = async (color: Color) => {
      playSound("success");
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (!data) return;

      const topCard = data.shared_data.discardPile[data.shared_data.discardPile.length - 1];
      const nextTurn = topCard.value === 'draw4' ? currentUser : targetOpponent;

      await supabase.from('multiplayer_state').update({
          shared_data: { 
              ...data.shared_data, 
              currentColor: color,
              pendingAction: "none",
              currentTurn: nextTurn
          }
      }).eq('id', 1);
  };

  const sayUno = async () => {
      if (myHand.length <= 2 && !myUnoSaid) {
          const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
          if (data) {
             const newEventId = (data.shared_data.lastEvent?.id || 0) + 1;
             await supabase.from('multiplayer_state').update({
                 shared_data: { ...data.shared_data, lastEvent: { id: newEventId, type: 'uno', payload: currentUser } },
                 [myPlayerField]: { ...data[myPlayerField], unoSaid: true }
             }).eq('id', 1);
          }
      }
  };

  const catchUno = async () => {
      playSound("error");
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (!data) return;

      if (opponentHandCount === 1 && !opponentUnoSaid) {
          let drawPile = [...data.shared_data.drawPile];
          let opHand = [...data[opPlayerField].hand];
          
          if (drawPile.length >= 2) {
              opHand.push(drawPile.pop()!);
              opHand.push(drawPile.pop()!);
          }

          await supabase.from('multiplayer_state').update({
              shared_data: { ...data.shared_data, drawPile: drawPile },
              [opPlayerField]: { ...data[opPlayerField], hand: opHand }
          }).eq('id', 1);
      }
  };

  const sendReaction = async (emoji: string) => {
      const { data } = await supabase.from('multiplayer_state').select('*').eq('id', 1).single();
      if (data) {
          const newEventId = (data.shared_data.lastEvent?.id || 0) + 1;
          await supabase.from('multiplayer_state').update({
              shared_data: { ...data.shared_data, lastEvent: { id: newEventId, type: 'reaction', payload: emoji } }
          }).eq('id', 1);
      }
  };

  const saveScoreToDatabase = async () => {
    if (isSaved || winner !== currentUser) return; 
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'uno_win',
      player_name: currentUser,
      score: 1
    }]);
    setIsSaved(true);
  };

  // EKSİK OLAN LOBİDEN ÇIKMA FONKSİYONU
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

  const renderCardVisual = (card: Card) => {
      const displayVal = card.value === 'skip' ? '🚫' : 
                         card.value === 'reverse' ? '🔄' : 
                         card.value === 'draw2' ? '+2' : 
                         card.value === 'draw4' ? '+4' : 
                         card.value === 'wild' ? '🌈' : card.value;

      return (
          <div className={`relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-[3px] flex flex-col items-center justify-center shadow-lg bg-white ${COLORS[card.color]} border-white`}>
              <div className="absolute top-1 left-2 text-white font-black text-xs sm:text-sm drop-shadow-md">{displayVal}</div>
              <div className="bg-white/20 w-12 h-16 sm:w-14 sm:h-20 rounded-full flex items-center justify-center transform -rotate-12">
                  <span className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg" style={{ textShadow: '2px 2px 0 #000' }}>
                      {displayVal}
                  </span>
              </div>
              <div className="absolute bottom-1 right-2 text-white font-black text-xs sm:text-sm transform rotate-180 drop-shadow-md">{displayVal}</div>
          </div>
      );
  };

  const bgTableColor = phase === "playing" ? "bg-[#0f5132]" : "bg-[#0f172a]";

  return (
    <main className={`flex flex-col min-h-screen transition-colors duration-500 relative ${bgTableColor}`}>
      
      {/* MASA ÖRTÜSÜ DOKUSU */}
      {phase === "playing" && (
         <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      )}

      {/* OYUN EKRANI */}
      {phase === "playing" ? (
        <div className="flex-1 flex flex-col justify-between w-full h-[100dvh] overflow-hidden py-4 px-2 z-10">
            
            {/* TEPKİ EFEKTİ (EMOJİ) */}
            {reaction && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 animate-in zoom-in duration-300">
                    <span className="text-[150px] drop-shadow-2xl animate-bounce">{reaction}</span>
                </div>
            )}

            {/* UNO BİLDİRİM EFEKTİ */}
            {unoNotification && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <h1 className="display-font text-5xl md:text-7xl text-yellow-400 font-black tracking-widest uppercase animate-bounce drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] text-center px-4">
                        {unoNotification}
                    </h1>
                </div>
            )}

            {/* ÜST: Efsun'un Eli (Yelpaze Kartlar) */}
            <div className="w-full flex flex-col items-center gap-2 mt-2 relative h-32 sm:h-40">
                <div className="flex items-center gap-3 absolute top-0 z-20">
                    <span className="bg-black/60 backdrop-blur-md px-4 py-1 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-md border border-white/10">
                        {targetOpponent}
                    </span>
                    {currentTurn === targetOpponent && pendingAction === "none" && (
                        <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded animate-pulse font-bold">DÜŞÜNÜYOR...</span>
                    )}
                </div>
                
                {/* Rakip Yelpaze */}
                <div className="relative w-full h-full flex justify-center mt-6">
                    {Array.from({ length: opponentHandCount }).map((_, i) => {
                        const offset = i - (opponentHandCount - 1) / 2;
                        const rotation = offset * -8; 
                        const translateY = Math.abs(offset) * -3; 
                        const translateX = offset * 25; 
                        
                        return (
                            <div key={i} className="absolute origin-top transition-all duration-500 ease-out"
                                 style={{ 
                                     transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
                                     zIndex: opponentHandCount - i
                                 }}>
                                 <div className="w-14 h-20 sm:w-16 sm:h-24 bg-red-600 border-2 border-white rounded-xl shadow-md flex items-center justify-center transform rotate-180">
                                     <span className="text-yellow-400 font-black text-lg italic" style={{ textShadow: '1px 1px 0 #000' }}>UNO</span>
                                 </div>
                            </div>
                        );
                    })}
                </div>

                {/* YAKALA BUTONU */}
                {opponentHandCount === 1 && !opponentUnoSaid && (
                    <button onClick={catchUno} className="absolute right-4 top-4 bg-red-500 text-white font-black px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse hover:scale-110 active:scale-95 transition-transform z-30 border border-white/30">
                        💥 YAKALA!
                    </button>
                )}
            </div>

            {/* ORTA: Masa (Deste ve Atılan Kart) */}
            <div className="w-full flex items-center justify-center gap-6 sm:gap-12 relative my-auto">
                
                {/* Renge Göre Parlayan Masa Ortası */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] blur-[80px] opacity-60 rounded-full pointer-events-none transition-colors duration-500 ${COLORS[currentColor]}`}></div>

                {/* Çekme Destesi */}
                <button 
                  onClick={handleDrawCard}
                  disabled={currentTurn !== currentUser || pendingAction !== "none"}
                  className={`w-20 h-28 sm:w-24 sm:h-36 bg-black border-4 border-red-500 rounded-2xl shadow-2xl flex items-center justify-center transition-transform z-10 ${currentTurn === currentUser && pendingAction === "none" ? 'hover:-translate-y-2 cursor-pointer ring-4 ring-yellow-400 animate-pulse' : 'opacity-80 cursor-not-allowed'}`}
                >
                    <span className="text-red-500 font-black text-2xl italic transform -rotate-12" style={{ textShadow: '2px 2px 0 #fff' }}>UNO</span>
                </button>

                {/* Atılan Kart (Discard) */}
                <div className="z-10 shadow-2xl scale-110 transform rotate-2">
                    {discardPile.length > 0 && renderCardVisual(discardPile[discardPile.length - 1])}
                </div>

                {/* Renk Seçim Modalı */}
                {pendingAction === "choosing_color" && currentTurn === currentUser && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md p-6 rounded-3xl z-50 flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in">
                        <span className="text-white font-black uppercase tracking-widest mb-4">Renk Seç</span>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleColorSelect("red")} className="w-16 h-16 bg-red-500 rounded-full shadow-lg hover:scale-110 active:scale-95 border-2 border-transparent hover:border-white"></button>
                            <button onClick={() => handleColorSelect("blue")} className="w-16 h-16 bg-blue-500 rounded-full shadow-lg hover:scale-110 active:scale-95 border-2 border-transparent hover:border-white"></button>
                            <button onClick={() => handleColorSelect("green")} className="w-16 h-16 bg-green-500 rounded-full shadow-lg hover:scale-110 active:scale-95 border-2 border-transparent hover:border-white"></button>
                            <button onClick={() => handleColorSelect("yellow")} className="w-16 h-16 bg-yellow-400 rounded-full shadow-lg hover:scale-110 active:scale-95 border-2 border-transparent hover:border-white"></button>
                        </div>
                    </div>
                )}

                {/* Tepki Butonları */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                    <button onClick={() => sendReaction("🤬")} className="text-2xl bg-black/40 w-10 h-10 rounded-full hover:bg-white/20 transition-colors border border-white/10">🤬</button>
                    <button onClick={() => sendReaction("🤣")} className="text-2xl bg-black/40 w-10 h-10 rounded-full hover:bg-white/20 transition-colors border border-white/10">🤣</button>
                    <button onClick={() => sendReaction("😎")} className="text-2xl bg-black/40 w-10 h-10 rounded-full hover:bg-white/20 transition-colors border border-white/10">😎</button>
                </div>
            </div>

            {/* ALT: Senin Elin (Yelpaze Kartlar) */}
            <div className="w-full flex flex-col items-center gap-2 mb-4 z-20 h-48 sm:h-56 relative">
                <div className="flex items-center gap-4 w-full justify-between px-6 absolute top-0 z-30">
                    <button 
                        onClick={sayUno} 
                        disabled={myHand.length > 2 || myUnoSaid}
                        className={`font-black text-lg px-6 py-2 rounded-full border-[3px] shadow-xl transition-all uppercase italic tracking-widest
                            ${myUnoSaid ? 'bg-green-500 text-white border-green-300 scale-95 opacity-50' : 
                              myHand.length <= 2 ? 'bg-yellow-400 text-red-600 border-red-500 hover:scale-110 animate-pulse' : 
                              'bg-black/40 text-white/30 border-black/20 cursor-not-allowed'}`}
                    >
                        {myUnoSaid ? "DEDİN!" : "UNO!"}
                    </button>
                    
                    <span className="bg-black/60 backdrop-blur-md px-4 py-1 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-md border border-white/10">
                        Senin Elin ({myHand.length})
                    </span>
                </div>

                {/* Senin Yelpaze */}
                <div className="relative w-full h-full flex justify-center mt-12">
                    {myHand.map((card, i) => {
                        const topCard = discardPile[discardPile.length - 1];
                        const isPlayable = currentTurn === currentUser && pendingAction === "none" && 
                                           (card.color === 'wild' || card.color === currentColor || card.value === topCard.value);
                        
                        const offset = i - (myHand.length - 1) / 2;
                        const rotation = offset * 8; 
                        const translateY = Math.abs(offset) * 4; 
                        const translateX = offset * 30; 
                        
                        return (
                            <div key={card.id} 
                                 className={`absolute origin-bottom transition-all duration-500 ease-out 
                                     ${isPlayable ? 'hover:-translate-y-8 hover:scale-110 cursor-pointer' : 'opacity-80 cursor-not-allowed'}
                                 `}
                                 style={{ 
                                     transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
                                     zIndex: isPlayable ? i + 10 : i 
                                 }}>
                                {renderCardVisual(card)}
                                <button 
                                   onClick={() => isPlayable && handlePlayCard(i)} 
                                   className="absolute inset-0 w-full h-full z-20 outline-none" 
                                   disabled={!isPlayable}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
      ) : (
        // --- DİĞER EKRANLAR (Lobi, Ayarlar, Sonuç) ---
        <div className="p-5 animate-in fade-in duration-500 flex flex-col h-full items-center justify-center relative z-10 w-full max-w-md mx-auto">
            
            {phase !== "finalResult" && (
            <div className="absolute top-5 left-5">
                <Link href="/games" onClick={() => playSound("click")} className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
                  <span>←</span> Oyunlar
                </Link>
            </div>
            )}

            {phase === "modeSelect" && (
                <div className="flex flex-col items-center justify-center gap-8 w-full mt-20">
                  <div className="text-center mb-2">
                    <div className="flex justify-center -space-x-4 mb-4">
                        <div className="w-16 h-24 bg-red-500 border-2 border-white rounded-xl shadow-lg transform -rotate-12 flex items-center justify-center"><span className="text-white font-black italic">U</span></div>
                        <div className="w-16 h-24 bg-yellow-400 border-2 border-white rounded-xl shadow-lg transform z-10 flex items-center justify-center"><span className="text-white font-black italic">N</span></div>
                        <div className="w-16 h-24 bg-blue-500 border-2 border-white rounded-xl shadow-lg transform rotate-12 flex items-center justify-center"><span className="text-white font-black italic">O</span></div>
                    </div>
                    <h2 className="display-font text-5xl text-white font-black tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">UNO</h2>
                    <p className="text-text/70 text-sm mt-2 font-medium tracking-wide">Özel 2 Kişilik Kapışma Kuralları!</p>
                  </div>

                  <div className="w-full flex flex-col gap-4 px-2">
                    <button onClick={joinLobby} className="w-full bg-primary text-background p-6 rounded-[32px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center gap-3 group border-2 border-transparent relative overflow-hidden">
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-300 relative z-10">🃏</span>
                      <span className="font-black tracking-widest uppercase text-lg relative z-10">Masaya Otur</span>
                    </button>
                  </div>
                </div>
            )}

            {phase === "settings" && (
                <div className="flex flex-col gap-6 w-full mt-10">
                  <div className="text-center mb-2">
                    <div className="text-5xl mb-2">⚙️</div>
                    <h2 className="display-font text-3xl text-primary">Oyun Odası</h2>
                  </div>

                  <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-1">Emircan</span>
                      <span className="text-3xl font-black text-primary">{leaderboard.emircan}</span>
                    </div>
                    <div className="text-2xl opacity-50 flex flex-col items-center">
                       <span className="text-[8px] uppercase tracking-widest font-bold mb-1">GALİBİYET</span>
                       ⚔️
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase tracking-widest text-text/50 font-bold mb-1">Efsun</span>
                      <span className="text-3xl font-black text-primary">{leaderboard.efsun}</span>
                    </div>
                  </div>
                  
                  <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6 mt-4">
                      <div className="text-center">
                        <div className="text-5xl mb-4 animate-bounce">🃏</div>
                        <h3 className="display-font text-2xl text-primary mb-2">Kurallar Kesin</h3>
                        <p className="text-text/60 text-[10px] font-bold tracking-widest uppercase leading-relaxed px-4">
                            +4 ve Yön Değiştirici atan sıra kaybetmez, tekrar oynar! Unutma, tek kart kaldığında UNO diye bağırmazsan rakibin seni yakalar.
                        </p>
                      </div>
                      <button onClick={toggleReady} className={`w-full py-5 rounded-[24px] font-black text-xl tracking-widest uppercase shadow-2xl transition-all duration-300 ${isMeReady ? 'bg-green-500 text-white border-4 border-green-400/50' : 'bg-card border-4 border-primary text-primary hover:bg-primary hover:text-background'}`}>
                        {isMeReady ? "👍 HAZIRSIN" : "HAZIRIM"}
                      </button>
                  </div>

                  {currentUser === "Emircan" && (
                    <button onClick={startGame} disabled={!isOpponentReady} className={`w-full mt-2 p-5 rounded-2xl shadow-xl transition-all duration-300 font-black text-lg tracking-widest uppercase ${isOpponentReady ? 'bg-primary text-background hover:scale-[1.02] ring-4 ring-primary/30' : 'bg-background border-2 border-primary/20 text-primary/40 cursor-not-allowed'}`}>
                      {isOpponentReady ? "KARTLARI DAĞIT 🚀" : "EFSUN BEKLENİYOR..."}
                    </button>
                  )}

                  <button onClick={exitLobby} className="text-[10px] text-red-500 uppercase tracking-widest font-bold mt-2 hover:underline text-center w-full">Odadan Çık</button>
                </div>
            )}

            {phase === "finalResult" && (
                <div className="flex flex-col items-center justify-center gap-6 w-full mt-20">
                  <div className="text-7xl drop-shadow-lg">👑</div>
                  
                  <h2 className="display-font text-5xl text-primary mb-2 text-center font-black">
                    {winner === currentUser ? "KAZANDIN!" : "KAYBETTİN..."}
                  </h2>
                  
                  <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
                    {winner === currentUser ? "Eline sağlık, rakibini masaya gömdün!" : "Senden önce kartlarını bitirdi. Acil rövanş lazım!"}
                  </p>

                  {winner === currentUser && !isSaved ? (
                     <button 
                      onClick={saveScoreToDatabase}
                      className="w-full bg-primary text-background py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform text-lg mb-4 uppercase tracking-widest"
                    >
                      Galibiyeti Kaydet 💾
                    </button>
                  ) : winner === currentUser ? (
                    <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-2xl font-bold text-center mb-4">
                      Skor başarıyla kaydedildi! ✅
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 w-full">
                    <button onClick={joinLobby} className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg">
                      🔄 Yeni El Dağıt (Rövanş)
                    </button>
                    <Link href="/games" onClick={() => playSound("click")} className="w-full bg-card border border-primary/20 text-text/80 p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center">
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