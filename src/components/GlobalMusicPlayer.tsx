"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GlobalMusicPlayer() {
  const [songs, setSongs] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // Varsayılan ses %50
  const [isExpanded, setIsExpanded] = useState(false); // YENİ: Barın açılıp kapanma durumu
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      const { data } = await supabase.from('jukebox_songs').select('*').order('id', { ascending: true });
      if (data && data.length > 0) {
        setSongs(data);
      } else {
        setSongs([{ url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }]);
      }
    };
    fetchSongs();
  }, []);

  // Oynatma ve Durdurma Kontrolü
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log("Otomatik çalma engellendi:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying]);

  // Ses Seviyesi Kontrolü
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextSong = () => {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  if (songs.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex items-center animate-in slide-in-from-bottom-10">
      
      <audio 
        ref={audioRef} 
        src={songs[currentIndex]?.url} 
        onEnded={nextSong} 
      />
      
      {/* MİNİ DÖNEN PLAK (Tıklayınca artık menüyü açıp kapatıyor) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative z-20 w-12 h-12 rounded-full bg-black flex items-center justify-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.5)] border-2 border-[#1a1a1a] hover:scale-105 transition-transform"
        style={{ animation: isPlaying ? 'spin 4s linear infinite' : 'none' }}
      >
        <div className="absolute w-[80%] h-[80%] rounded-full border border-white/10"></div>
        <div className="absolute w-[60%] h-[60%] rounded-full border border-white/10"></div>
        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-background rounded-full"></div>
        </div>
      </div>

      {/* GİZLENİP AÇILAN KONTROL BARI */}
      <div 
        className={`flex items-center bg-card/80 backdrop-blur-md border-y border-r border-primary/30 rounded-r-full shadow-2xl transition-all duration-500 ease-in-out overflow-hidden relative z-10 ${
          isExpanded ? 'max-w-[250px] opacity-100 pl-6 pr-4 py-2 translate-x-0' : 'max-w-0 opacity-0 pl-0 pr-0 py-2 -translate-x-5 border-none'
        }`}
        style={{ marginLeft: '-16px' }} // Barın plağın tam arkasından çıkmasını sağlar
      >
        {/* KONTROLLER */}
        <div className="flex items-center gap-1 text-primary min-w-[70px]">
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
            className="w-8 h-8 flex items-center justify-center hover:bg-primary/20 rounded-full transition-colors font-black shrink-0"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); nextSong(); }} 
            className="w-8 h-8 flex items-center justify-center hover:bg-primary/20 rounded-full transition-colors font-black shrink-0"
          >
            {'⏭'}
          </button>
        </div>

        {/* SES AYAR BARI */}
        <div className="flex items-center gap-1.5 ml-2 border-l border-primary/20 pl-3 min-w-[100px]">
          <span className="text-[12px] opacity-70 shrink-0">🔉</span>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all shrink-0"
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}