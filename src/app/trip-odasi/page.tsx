"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

type ReelNote = { id: string; url: string; note: string };

const STAR_COORDS = [
  { x: 20, y: 30 }, { x: 50, y: 20 }, { x: 80, y: 40 }, { x: 70, y: 70 }, { x: 30, y: 80 },
  { x: 10, y: 50 }, { x: 90, y: 20 }, { x: 40, y: 90 }, { x: 60, y: 10 }, { x: 80, y: 85 }
];

export default function AstroTripRoomPage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [isLoading, setIsLoading] = useState(true);
  
  const [roomMode, setRoomMode] = useState<"trip" | "peace">("trip");
  const [spotifyUrl, setSpotifyUrl] = useState<string>("");
  const [reels, setReels] = useState<ReelNote[]>([]);
  
  // Güvercin / Dilek Yıldızı State'leri
  const [pigeonActive, setPigeonActive] = useState(false);
  const [peaceMessage, setPeaceMessage] = useState("");
  const [isWritingNote, setIsWritingNote] = useState(false);
  const [isReadingNote, setIsReadingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  // Arızalı Hologram (Efsun'un Trip Mesajı) State'leri
  const [efsunMessage, setEfsunMessage] = useState("");
  const [isHoloOpen, setIsHoloOpen] = useState(false);
  const [draftEfsunMsg, setDraftEfsunMsg] = useState("");

  const [newSpotify, setNewSpotify] = useState("");
  const [newReelUrl, setNewReelUrl] = useState("");
  const [newReelNote, setNewReelNote] = useState("");
  const [confirmTrash, setConfirmTrash] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    
    fetchRoomState();

    const channel = supabase
      .channel('trip_room_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_room', filter: 'id=eq.1' }, (payload: any) => {
        if (payload.new && Object.keys(payload.new).length > 0) {
          setRoomMode(payload.new.mode);
          setSpotifyUrl(payload.new.spotify_url || "");
          setReels(payload.new.reels || []);
          setPigeonActive(payload.new.pigeon_active || false);
          setPeaceMessage(payload.new.peace_message || "");
          setEfsunMessage(payload.new.efsun_message || "");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRoomState = async () => {
    const { data } = await supabase.from('trip_room').select('*').eq('id', 1).single();
    if (data) {
      setRoomMode(data.mode || "trip");
      setSpotifyUrl(data.spotify_url || "");
      setReels(data.reels || []);
      setPigeonActive(data.pigeon_active || false);
      setPeaceMessage(data.peace_message || "");
      setEfsunMessage(data.efsun_message || "");
    } else {
      const defaultState = { id: 1, mode: "trip", spotify_url: "", reels: [], pigeon_active: false, peace_message: "", efsun_message: "" };
      await supabase.from('trip_room').upsert([defaultState]);
    }
    setIsLoading(false);
  };

  const updateRoomState = async (updates: any) => {
    await supabase.from('trip_room').update(updates).eq('id', 1);
  };

  const toggleRoomMode = () => {
    if (currentUser !== "Efsun") return; 
    playSound("click");
    const newMode = roomMode === "trip" ? "peace" : "trip";
    setRoomMode(newMode);
    updateRoomState({ mode: newMode });
  };

  // Hologram Mesajını Kaydetme (Sadece Efsun)
  const saveEfsunMessage = () => {
    playSound("success");
    setEfsunMessage(draftEfsunMsg);
    updateRoomState({ efsun_message: draftEfsunMsg });
    setIsHoloOpen(false);
  };

  const handleSpotifySubmit = () => {
    if (!newSpotify.trim()) return;
    playSound("click");
    setSpotifyUrl(newSpotify);
    setNewSpotify("");
    updateRoomState({ spotify_url: newSpotify });
  };

  const clearSpotify = () => {
    playSound("click");
    setSpotifyUrl("");
    updateRoomState({ spotify_url: "" });
  };

  const handleAddReel = () => {
    if (!newReelUrl.trim()) return;
    playSound("success");
    const newReel = { id: Date.now().toString(), url: newReelUrl, note: newReelNote };
    const updatedReels = [...reels, newReel];
    setReels(updatedReels);
    setNewReelUrl("");
    setNewReelNote("");
    updateRoomState({ reels: updatedReels });
  };

  const handleReelClick = async (e: React.MouseEvent, reel: ReelNote) => {
    e.preventDefault();
    playSound("click");
    
    const validUrl = reel.url.startsWith('http') ? reel.url : `https://${reel.url}`;
    window.open(validUrl, "_blank");

    if (currentUser === "Emircan") {
      const updatedReels = reels.filter(r => r.id !== reel.id);
      setReels(updatedReels);
      await updateRoomState({ reels: updatedReels });
    }
  };

  const emptyTrash = () => {
    playSound("over"); 
    setReels([]);
    setConfirmTrash(false);
    updateRoomState({ reels: [] });
  };

  const sendComet = () => {
    if (!draftNote.trim()) return;
    playSound("success");
    setPigeonActive(true);
    setPeaceMessage(draftNote);
    setIsWritingNote(false);
    setDraftNote("");
    updateRoomState({ pigeon_active: true, peace_message: draftNote });
  };

  const acceptPeace = () => {
    playSound("success");
    setRoomMode("peace");
    setPigeonActive(false);
    setIsReadingNote(false);
    // Barışınca Efsun'un sitem mesajını da temizliyoruz
    updateRoomState({ mode: "peace", pigeon_active: false, efsun_message: "" });
    setEfsunMessage("");
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes('spotify.com')) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname; 
        return `https://open.spotify.com/embed${pathname}?utm_source=generator&theme=0`;
      } catch (e) {
        return url;
      }
    }
    return url;
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-300 animate-pulse font-bold tracking-widest uppercase">Kozmik Ağa Bağlanılıyor...</div>;

  return (
    <main className="fixed inset-0 w-full h-full bg-black flex flex-col font-sans text-white overflow-hidden">
      
      {/* 🌌 ARKA PLAN VE ATMOSFER */}
      <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none z-0 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3b0718] via-[#0a0005] to-black"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] md:w-[600px] md:h-[600px] bg-red-900/15 blur-[100px] rounded-full animate-pulse"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-screen"></div>
      </div>

      <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none z-0 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e3a5f] via-[#0a192f] to-black"></div>
         <div className="absolute top-0 left-0 w-full h-[50vh] bg-yellow-500/10 blur-[150px]"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[50vw] h-[50vh] bg-blue-400/15 blur-[120px] rounded-full transform rotate-12"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 mix-blend-screen"></div>
      </div>

      {/* ============================================================================== */}
      {/* 🛸 KONTROL PANELİ (NAVBAR'IN HEMEN ALTINDA, ASLA GÖMÜLMEZ) */}
      {/* ============================================================================== */}
      <div className="w-full flex items-center justify-between px-4 pt-20 pb-2 z-[200] relative pointer-events-none">
        
        {/* SOL ÜST - SADECE EMİRCAN */}
        <div className="pointer-events-auto flex flex-col gap-2 items-start">
          {currentUser === "Emircan" && !pigeonActive && (
             <button 
               onClick={() => setIsWritingNote(true)} 
               className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.6)] animate-pulse hover:scale-105 border border-purple-300 transition-transform"
             >
               Dilek Yıldızı 🌠
             </button>
          )}
        </div>
        
        {/* SAĞ ÜST - EFSUN İÇİN BUTON, EMİRCAN İÇİN BİLGİ */}
        <div className="pointer-events-auto">
          {currentUser === "Efsun" ? (
            <button 
              onClick={toggleRoomMode}
              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border transition-all duration-300 hover:scale-105 active:scale-95 ${roomMode === 'trip' ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-blue-500 text-white border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.6)]'}`}
            >
               İklimi Değiştir 🌤️⛈️
            </button>
          ) : (
            <div className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border shadow-lg transition-colors duration-1000 pointer-events-none ${roomMode === 'trip' ? 'bg-red-900/40 text-red-300 border-red-500/50' : 'bg-blue-900/40 text-blue-200 border-blue-400/50'}`}>
               ŞU AN: {roomMode === 'trip' ? 'FIRTINA ⛈️' : 'HUZUR ✨'}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 📡 ARIZALI HOLOGRAM UYDUSU (ÜST-ORTADA YÜZEN SİNYAL) */}
      {/* ============================================================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-satellite {
          0% { transform: translate(-50%, 0px); }
          50% { transform: translate(-50%, 10px); }
          100% { transform: translate(-50%, 0px); }
        }
        .animate-float-sat { animation: float-satellite 4s ease-in-out infinite; }
      `}} />

      {roomMode === 'trip' && (
         <div 
           onClick={() => {
              setDraftEfsunMsg(efsunMessage);
              setIsHoloOpen(true);
              playSound("click");
           }}
           className="absolute top-28 md:top-20 left-1/2 z-[150] flex flex-col items-center group cursor-pointer animate-float-sat pointer-events-auto"
         >
            <div className="relative w-12 h-12 flex items-center justify-center">
               {/* Sinyal varsa etrafa yayılan kırmızı dalgalar */}
               {efsunMessage && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-60"></div>
                    <div className="absolute -inset-2 rounded-full border border-red-500/50 animate-ping opacity-40" style={{animationDelay: '0.2s'}}></div>
                  </>
               )}
               {/* Uydu İkonu */}
               <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${efsunMessage ? 'bg-red-900/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-white/10 border-white/20 group-hover:bg-white/20'}`}>
                  <span className={`text-xl ${efsunMessage ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'opacity-50'}`}>📡</span>
               </div>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest mt-2 transition-colors ${efsunMessage ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse' : 'text-white/40'}`}>
               {efsunMessage ? 'Kayıp Sinyal' : 'Uydu Ağı'}
            </span>
         </div>
      )}

      {/* ARIZALI HOLOGRAM MODALI (Cızırtılı Ekran) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes holo-glitch {
          0% { text-shadow: 2px 0 rgba(255,0,0,0.8), -2px 0 rgba(0,0,255,0.8); transform: translate(0); }
          20% { text-shadow: -2px 0 rgba(255,0,0,0.8), 2px 0 rgba(0,0,255,0.8); transform: translate(-1px, 1px); }
          40% { text-shadow: 2px 0 rgba(255,0,0,0.8), -2px 0 rgba(0,0,255,0.8); transform: translate(1px, -1px); }
          60% { text-shadow: -2px 0 rgba(255,0,0,0.8), 2px 0 rgba(0,0,255,0.8); transform: translate(-1px, 0); }
          80% { text-shadow: 2px 0 rgba(255,0,0,0.8), -2px 0 rgba(0,0,255,0.8); transform: translate(1px, 1px); }
          100% { text-shadow: -2px 0 rgba(255,0,0,0.8), 2px 0 rgba(0,0,255,0.8); transform: translate(0); }
        }
        .text-glitch { animation: holo-glitch 0.2s linear infinite; }
      `}} />

      {isHoloOpen && (
         <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
            <div className="bg-[#1a0505]/90 border border-red-600/50 p-6 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.5),inset_0_0_20px_rgba(239,68,68,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-200">
               
               {/* Hologram Tarama Çizgileri (Scanlines) */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
               <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay animate-pulse pointer-events-none"></div>

               <button onClick={() => setIsHoloOpen(false)} className="absolute top-3 right-4 text-red-500 hover:text-red-400 font-black text-sm z-10 transition-colors">X</button>
               
               <h3 className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="animate-ping">⚠️</span> BAĞLANTI KOPTU - SON MESAJ
               </h3>
               
               {currentUser === 'Efsun' ? (
                  <div className="relative z-10 flex flex-col gap-3">
                     <textarea 
                        value={draftEfsunMsg} 
                        onChange={e => setDraftEfsunMsg(e.target.value)} 
                        className="w-full h-28 bg-black/60 border border-red-500/30 text-red-300 p-3 text-xs outline-none focus:border-red-500 resize-none font-mono placeholder:text-red-900/50" 
                        placeholder="Emircan'a sitemini uzay boşluğuna bırak..."
                     />
                     <div className="flex gap-2">
                        <button onClick={() => setIsHoloOpen(false)} className="flex-1 py-2.5 bg-transparent border border-red-900/50 text-red-500/70 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors">İptal</button>
                        <button onClick={saveEfsunMessage} className="flex-1 py-2.5 bg-red-900/40 hover:bg-red-800/60 border border-red-500 text-red-200 text-[10px] font-black uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">YAYINA VER 📡</button>
                     </div>
                  </div>
               ) : (
                  <div className="relative z-10 font-mono text-sm text-red-400 min-h-[100px] flex items-center justify-center p-4 bg-black/40 border border-red-900/30 rounded-lg">
                     {efsunMessage ? (
                        <p className="whitespace-pre-wrap text-glitch tracking-wide leading-relaxed text-center">
                           {efsunMessage}
                        </p>
                     ) : (
                        <p className="text-red-900/40 italic text-xs uppercase tracking-widest">Sinyal boş, mesaj yok...</p>
                     )}
                  </div>
               )}
            </div>
         </div>
      )}


      {/* ============================================================================== */}
      {/* 🌠 MODALLAR VE SAF CSS KUYRUKLU YILDIZ */}
      {/* ============================================================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes comet-fly {
          0% { transform: translate(-30vw, -30vw) rotate(45deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(150vw, 150vw) rotate(45deg); opacity: 0; }
        }
        .animate-comet { animation: comet-fly 4s linear infinite; }
      `}} />

      {pigeonActive && (
         <div className="absolute inset-0 z-[9999] pointer-events-none overflow-hidden">
            <div 
              onClick={() => currentUser === 'Efsun' && setIsReadingNote(true)} 
              className="absolute top-0 left-0 pointer-events-auto cursor-pointer animate-comet flex items-center justify-center w-32 h-32 group"
            >
               <div className="relative w-4 h-4 bg-white rounded-full shadow-[0_0_20px_6px_rgba(255,255,255,0.9),0_0_40px_12px_rgba(59,130,246,0.8)] flex items-center justify-center group-hover:scale-125 transition-transform">
                  <div className="absolute top-1/2 right-2 w-64 h-[3px] bg-gradient-to-r from-transparent via-blue-200 to-white transform -translate-y-1/2 opacity-90 blur-[1px]"></div>
               </div>
               
               {currentUser === 'Efsun' && (
                 <div className="absolute top-16 right-16 whitespace-nowrap bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold tracking-widest uppercase text-blue-200 animate-pulse drop-shadow-md" style={{ transform: 'rotate(-45deg)' }}>
                    Mektubu Aç 💌
                 </div>
               )}
            </div>
         </div>
      )}

      {isWritingNote && (
         <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in pointer-events-auto">
            <div className="bg-[#0f172a] p-6 rounded-[32px] max-w-sm w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col gap-4 border-2 border-blue-500/50 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-purple-500"></div>
               <h3 className="text-base font-black text-blue-300 uppercase tracking-widest text-center mt-2">Kozmik Mesaj Gönder</h3>
               <textarea 
                 value={draftNote} 
                 onChange={(e) => setDraftNote(e.target.value)} 
                 placeholder="Yıldızların arasından süzülecek tatlı bir şeyler yaz..." 
                 className="w-full h-32 bg-black/60 border border-white/20 rounded-2xl p-4 text-sm text-white outline-none resize-none font-medium focus:border-blue-400 transition-colors"
               />
               <div className="flex gap-3">
                  <button onClick={() => setIsWritingNote(false)} className="flex-1 py-3 bg-white/10 rounded-xl text-[11px] uppercase tracking-widest font-bold text-white/70 hover:bg-white/20 transition-colors">İptal</button>
                  <button onClick={sendComet} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition-colors">Fırlat 🌠</button>
               </div>
            </div>
         </div>
      )}

      {isReadingNote && (
         <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 pointer-events-auto">
            <div className="bg-[#0f172a] border-2 border-blue-400/50 p-8 rounded-[32px] max-w-md w-full shadow-[0_0_60px_rgba(59,130,246,0.4)] relative text-white font-serif overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none"></div>
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-600 rounded-full border-4 border-[#0f172a] shadow-[0_0_20px_rgba(37,99,235,0.8)] flex items-center justify-center text-white text-lg z-10">✨</div>
               
               <span className="text-6xl text-blue-400/30 block mb-2 leading-none relative z-10">"</span>
               <p className="text-base leading-relaxed mb-6 font-medium whitespace-pre-wrap relative z-10">{peaceMessage}</p>
               <div className="text-right text-sm italic text-blue-300 font-bold mb-8 relative z-10">- Emircan</div>
               
               <div className="flex gap-3 font-sans relative z-10">
                  <button onClick={() => setIsReadingNote(false)} className="flex-1 py-4 bg-white/10 border border-white/20 text-white/80 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-colors">Karanlıkta Kal ⛈️</button>
                  <button onClick={acceptPeace} className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition-colors">Güneşi Aç ☀️</button>
               </div>
            </div>
         </div>
      )}

      {/* ============================================================================== */}
      {/* 🛸 ANA İÇERİK - DİKEY KAYDIRMA İLE */}
      {/* ============================================================================== */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-start md:justify-center p-4 gap-6 md:gap-12 relative z-10 overflow-y-auto custom-scrollbar pt-28 pb-32">
         
         <div className="w-full max-w-sm flex flex-col items-center mt-2">
            <div className={`w-full bg-black/50 backdrop-blur-md rounded-[32px] p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] border transition-colors duration-1000 relative ${roomMode === 'trip' ? 'border-red-500/30' : 'border-blue-400/30'}`}>
               
               {spotifyUrl && (
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-[32px] border-2 animate-ping opacity-20 pointer-events-none ${roomMode === 'trip' ? 'border-red-500' : 'border-blue-500'}`}></div>
               )}

               <h3 className="text-[10px] font-black uppercase tracking-widest text-center text-white/60 mb-4 flex items-center justify-center gap-2">
                 <span>📡</span> Frekans Yayını
               </h3>

               <div className="w-full h-[152px] rounded-2xl overflow-hidden relative bg-black/40 border border-white/5">
                  {spotifyUrl ? (
                    <>
                      <iframe src={getEmbedUrl(spotifyUrl)} width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                      {currentUser === "Efsun" && (
                         <button onClick={clearSpotify} className="absolute -top-1 -right-1 w-8 h-8 bg-red-600 backdrop-blur-sm text-white rounded-full text-xs font-black shadow-lg flex items-center justify-center hover:scale-110 z-50 border-2 border-white/20">X</button>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-50">
                      <span className="text-3xl mb-2">🔇</span>
                      <p className="text-[9px] font-bold tracking-widest uppercase">Sinyal Bekleniyor...</p>
                    </div>
                  )}
               </div>

               {currentUser === "Efsun" && !spotifyUrl && (
                  <div className="mt-4 flex flex-col gap-2 w-full">
                     <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify Şarkı Linki..." className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-xs outline-none text-white placeholder:text-white/40 focus:border-blue-400/50 transition-colors" />
                     <button onClick={handleSpotifySubmit} className="bg-white/20 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-colors shadow-sm">Uzaya Yayınla</button>
                  </div>
               )}
            </div>
         </div>

         <div className="w-full max-w-sm aspect-square bg-black/30 backdrop-blur-sm border border-white/10 rounded-[40px] md:rounded-full relative flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] rounded-[40px] md:rounded-full [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)] pointer-events-none"></div>

            <button onClick={() => setConfirmTrash(true)} className="absolute bottom-4 right-4 md:-bottom-2 md:-right-2 w-14 h-14 bg-black border-2 border-red-500/40 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-center justify-center hover:scale-110 hover:border-red-500 transition-all z-40 group" title="Yıldızları Yut">
               <div className="absolute inset-0 rounded-full bg-red-500/10 opacity-0 group-hover:opacity-100 animate-ping"></div>
               <span className="text-2xl">🕳️</span>
            </button>
            
            {confirmTrash && (
               <div className="absolute bottom-20 right-0 md:-bottom-20 md:-right-10 bg-black/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-red-500/50 z-50 w-56 text-center animate-in zoom-in-95">
                  <p className="text-[10px] font-bold mb-3 uppercase tracking-widest text-red-400 leading-tight">
                    Bütün yıldızlar karadeliğe çekilip silinsin mi?
                  </p>
                  <div className="flex gap-2">
                     <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-white/10 text-white rounded-xl text-[10px] py-2 font-bold hover:bg-white/20 transition-colors">İptal</button>
                     <button onClick={emptyTrash} className="flex-1 bg-red-600 text-white rounded-xl text-[10px] py-2 font-black shadow-[0_0_15px_rgba(239,68,68,0.6)]">YUT</button>
                  </div>
               </div>
            )}

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {reels.map((reel, index) => {
                if (index === 0) return null;
                const prev = STAR_COORDS[(index - 1) % STAR_COORDS.length];
                const curr = STAR_COORDS[index % STAR_COORDS.length];
                return (
                  <line 
                    key={`line-${reel.id}`} 
                    x1={`${prev.x}%`} y1={`${prev.y}%`} 
                    x2={`${curr.x}%`} y2={`${curr.y}%`} 
                    stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4"
                  />
                );
              })}
            </svg>

            {reels.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center opacity-30 text-white font-black text-sm uppercase tracking-widest z-20 pointer-events-none">Gökyüzü Boş</div>
            ) : (
               reels.map((reel, index) => {
                 const coord = STAR_COORDS[index % STAR_COORDS.length];
                 return (
                   <div 
                     onClick={(e) => handleReelClick(e, reel)} 
                     key={reel.id} 
                     className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,1)] hover:scale-[2] transition-transform group flex items-center justify-center cursor-pointer z-30"
                     style={{ left: `${coord.x}%`, top: `${coord.y}%`, transform: 'translate(-50%, -50%)' }}
                   >
                      <div className="absolute w-10 h-10 rounded-full border border-white/30 animate-ping opacity-60 pointer-events-none"></div>
                      <div className="absolute top-8 whitespace-nowrap bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
                         {reel.note || "Bağlantıyı Aç"}
                      </div>
                   </div>
                 );
               })
            )}

            {currentUser === "Efsun" && (
               <div className="absolute top-[105%] left-1/2 -translate-x-1/2 w-full max-w-[280px] bg-black/70 backdrop-blur-xl p-4 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-white/10 z-50">
                  <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Bağlantı (URL)..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-2 text-xs outline-none text-white focus:border-white/30 transition-colors" />
                  <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="Kısa bir not..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-3 text-xs outline-none text-white focus:border-white/30 transition-colors" />
                  <button onClick={handleAddReel} className="w-full py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors shadow-sm">Gökyüzüne Ekle ✨</button>
               </div>
            )}
         </div>

      </div>

      {/* 🌕 ALT BÖLGE: AY / GÜNEŞ */}
      <div className="absolute bottom-[-15%] md:bottom-[-25%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] pointer-events-none z-0 flex items-center justify-center transition-all duration-1000">
         {roomMode === 'trip' ? (
            <div className="relative w-full h-full rounded-full bg-[#cbd5e1] shadow-[0_0_100px_rgba(203,213,225,0.3),inset_0_-40px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-pulse" style={{ animationDuration: '4s' }}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/moon-crater.png')] opacity-40 mix-blend-multiply"></div>
            </div>
         ) : (
            <div className="relative w-full h-full rounded-full bg-[#fde047] shadow-[0_0_150px_rgba(253,224,71,0.6),inset_0_-20px_50px_rgba(234,179,8,0.8)] overflow-hidden">
               <div className="absolute inset-0 bg-orange-400/20 blur-xl animate-pulse"></div>
            </div>
         )}
      </div>

    </main>
  );
}