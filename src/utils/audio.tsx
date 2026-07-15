"use client";
import { supabase } from "@/lib/supabaseClient";

let soundUrls: Record<string, string> = {};
let isLoaded = false;
let audioCtx: AudioContext | null = null; 

export const loadSounds = async () => {
  if (isLoaded) return;
  try {
    const { data } = await supabase.from('app_sounds').select('*');
    if (data) {
      data.forEach(item => {
        soundUrls[item.action] = item.url;
      });
      isLoaded = true;
    }
  } catch (error) {
    console.error("Sesler Supabase'den çekilemedi", error);
  }
};

export const playSound = async (type: string) => {
  if (typeof window === "undefined") return;

  if (!isLoaded) await loadSounds();

  // 1. SUPABASE SESİ (Senin eklediklerin)
  if (soundUrls[type]) {
    const audio = new Audio(soundUrls[type]);
    // catch ile hatayı yutuyoruz ki uygulama kilitlenmesin
    audio.play().catch(e => console.log("Mobil tarayıcı sesi engelledi, animasyon devam ediyor:", e));
    return;
  }

  // 2. SENTETİK SESLER (Yedek Sistem)
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    
    // KRİTİK MOBİL DÜZELTMESİ: await kaldırıldı!
    // Telefon ses motorunu uykuya alsa bile, kod burada donup kalmayacak.
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.log("Ses motoru bekliyor:", e));
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    switch (type) {
      case "click":
        osc.type = "sine"; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1); break;
      case "tick":
      case "memory_tick":
        osc.type = "triangle"; osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05); break;
      case "success":
        osc.type = "sine"; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4); break;
      case "start":
        osc.type = "square"; osc.frequency.setValueAtTime(300, now); osc.frequency.setValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3); break;
      case "over":
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5); break;
      case "wardrobe_open":
        osc.type = "sine"; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(400, now + 0.3);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.15); gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3); break;
      case "wardrobe_close":
        osc.type = "sine"; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2); break;
      case "photo_add":
      case "map_pin":
        osc.type = "square"; osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1); break;
      case "list_add":
        osc.type = "sine"; osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(700, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2); break;
      case "list_tick":
        osc.type = "sine"; osc.frequency.setValueAtTime(800, now); osc.frequency.setValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3); break;
      case "wordle_key":
        osc.type = "square"; osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05); break;
      case "memory_dial":
        osc.type = "triangle"; osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now); osc.stop(now + 0.03); break;
    }
  } catch (error) {
    console.error("Ses motoru başlatılamadı:", error);
  }
};