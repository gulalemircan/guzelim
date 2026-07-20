"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient"; 
import { playSound } from "@/utils/audio";

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
}

interface ChatMeme {
  id: number;
  name: string;
  url: string;
  volume?: number; 
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [inputText, setInputText] = useState("");
  const [errorAnim, setErrorAnim] = useState(false);
  const [showMemeMenu, setShowMemeMenu] = useState(false);
  
  // YENİ: RÖNTGEN SİSTEMİ (Tüm adımları kaydedecek)
  const [logs, setLogs] = useState<string[]>(["🔍 Röntgen Sistemi Başlatıldı..."]);
  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);
  
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [memes, setMemes] = useState<ChatMeme[]>([]); 
  const memesRef = useRef<ChatMeme[]>([]); 

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
  }, [isOpen]);

  // UYGULAMA AÇILDIĞINDA TELEFONU CHECK-UP'A SOKUYORUZ
  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // 1. Cihaz PWA (Ana Ekran) modunda mı kontrolü
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        addLog(`PWA Modu (Ana Ekran): ${isStandalone ? "✅ EVET" : "❌ HAYIR (Tarayıcıdasın)"}`);

        // 2. Service Worker Desteği
        if (!('serviceWorker' in navigator)) {
          addLog("❌ HATA: Tarayıcın Service Worker desteklemiyor!");
          return;
        }
        addLog("✅ Service Worker Desteği Var");

        // 3. Push API Desteği (iPhone'ların en çok takıldığı yer)
        if (!('PushManager' in window)) {
          addLog("❌ HATA: PushManager YOK! (Apple/Tarayıcı bildirim altyapısını engelliyor)");
          return;
        }
        addLog("✅ PushManager Desteği Var");

        // 4. Motor Kurulumu
        addLog("Motor register ediliyor...");
        const reg = await navigator.serviceWorker.register('/sw.js');
        addLog(`✅ Motor Register Edildi. Durum: ${reg.active ? 'Aktif' : 'Uykuda/Bekliyor'}`);

        addLog("Motorun tam hazır olması bekleniyor...");
        await navigator.serviceWorker.ready;
        addLog("✅ Motor TAM Hazır!");
        setSwReg(reg);

      } catch (err: any) {
        addLog(`❌ KRİTİK SİSTEM HATASI: ${err.message}`);
      }
    };

    if (isOpen) {
      runDiagnostics();
      window.dispatchEvent(new CustomEvent("chat-opened"));
    } else {
      window.dispatchEvent(new CustomEvent("chat-closed"));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, logs]);

  useEffect(() => { memesRef.current = memes; }, [memes]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: true }); 
      if (msgData) setMessages(msgData);

      const { data: memeData } = await supabase.from('chat_memes').select('*').order('id', { ascending: true });
      if (memeData) setMemes(memeData);
    };

    fetchInitialData();

    const channel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);

        if (newMsg.text.startsWith("🔊 Sesli Mesaj: ")) {
          const memeName = newMsg.text.replace("🔊 Sesli Mesaj: ", "");
          const foundMeme = memesRef.current.find(m => m.name === memeName);
          
          if (foundMeme && foundMeme.url) {
            const audio = new Audio(foundMeme.url);
            audio.volume = foundMeme.volume !== undefined && foundMeme.volume !== null ? foundMeme.volume : 1.0;
            audio.play().catch(err => console.log("Meme sesi çalınamadı:", err));
          }
        } else {
          playSound("message_receive");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleEnableNotifications = async () => {
    try {
      addLog("🔔 Zile Basıldı. İzin isteniyor...");
      const permission = await Notification.requestPermission();
      addLog(`İzin durumu: ${permission}`);
      
      if (permission === 'granted') {
        let registration = swReg;
        
        if (!registration) {
          addLog("Motor ref'ten okunamadı, ready bekleniyor...");
          registration = await navigator.serviceWorker.ready;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          addLog("❌ HATA: VAPID Key bulunamadı!"); 
          return;
        }

        addLog("Abonelik şifresi oluşturuluyor...");
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        try {
          addLog("PushManager.subscribe() tetikleniyor...");
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });

          addLog("Supabase'e kaydediliyor...");
          const savedName = localStorage.getItem("myName");
          const subString = JSON.stringify(subscription);
          
          const { error } = await supabase.from('push_subscriptions').insert([{ 
             user_name: savedName || "Efsun", 
             subscription: JSON.parse(subString) 
          }]);

          if (error) {
            addLog(`❌ Veritabanı Hatası: ${error.message}`);
          } else {
            addLog("✅✅ BAŞARILI! Cihaz Supabase'e kaydedildi.");
          }
        } catch (subErr: any) {
          addLog(`❌ ABONELİK HATASI: ${subErr.message}`);
        }
        
      } else {
        addLog("❌ İzin verilmedi.");
      }
    } catch (err: any) {
      addLog(`❌ Beklenmeyen Hata: ${err.message}`);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const textLower = textToSend.toLowerCase();
    
    if (textLower.includes("peki") || textLower.includes("sen bilirsin")) {
      setErrorAnim(true);
      if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
      setTimeout(() => setErrorAnim(false), 1000);
      return;
    }

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMessage = { sender: currentUser, text: textToSend, time: timeString };
    const { error } = await supabase.from('messages').insert([newMessage]);

    if (!error) {
      if (!customText) setInputText("");
      setShowMemeMenu(false);

      const targetName = currentUser === "Emircan" ? "Efsun" : "Emircan";
      let notificationText = textToSend;
      
      if (textToSend.startsWith("🔊 Sesli Mesaj: ")) {
        notificationText = "Sana bir sesli mesaj gönderdi 🎵";
      }
      
      fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName: currentUser, text: notificationText, targetName: targetName })
      }).catch(console.error);

    } else {
      console.error("Mesaj gitmedi:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSend(); };
  const sendMeme = (memeName: string) => { handleSend(`🔊 Sesli Mesaj: ${memeName}`); };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {isOpen && (
        <div className="bg-card border border-primary/20 rounded-[32px] shadow-2xl flex flex-col overflow-hidden w-[calc(100vw-3rem)] sm:w-[350px] h-[65dvh] sm:h-[500px] mb-2 sm:mb-4 animate-in slide-in-from-bottom-5">
          
          <div className="bg-primary/10 border-b border-primary/20 p-4 flex flex-col gap-3 backdrop-blur-md">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="display-font text-lg text-primary">Özel Sohbet 💬</h3>
                <p className="text-[9px] uppercase tracking-widest text-primary/60 font-bold">Uçtan Uca Aşk Korumalı</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleEnableNotifications}
                  className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg active:scale-95"
                  title="Bildirimleri Aç ve Kaydet"
                >
                  🔔
                </button>

                <button 
                  onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.replace('/'); }}
                  className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors"
                >
                  Çıkış
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center bg-card rounded-full text-primary hover:bg-primary hover:text-background transition-colors font-bold shadow-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* RÖNTGEN EKRANI */}
            <div className="bg-black/90 text-green-400 p-2 rounded-lg text-[10px] font-mono shadow-inner border border-green-500/30 max-h-32 overflow-y-auto flex flex-col gap-1">
              {logs.map((log, i) => (
                <span key={i} className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-300' : ''}>
                  {log}
                </span>
              ))}
            </div>
            
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
            {messages.map((msg) => {
              const isMe = msg.sender === currentUser;
              return (
                <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`flex flex-col max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                    <span className="text-[9px] text-primary/50 font-bold tracking-widest uppercase mb-1 px-1">{msg.sender}</span>
                    <div className={`p-3 rounded-2xl shadow-sm ${isMe ? "bg-primary text-background rounded-tr-none" : "bg-background border border-primary/20 text-text rounded-tl-none"}`}>
                      <p className="text-sm font-medium leading-relaxed break-words">{msg.text}</p>
                    </div>
                    <span className="text-[8px] text-primary/40 font-bold mt-1 px-1">{msg.time}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            {errorAnim && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase animate-bounce shadow-xl whitespace-nowrap">🚨 Yasaklı Kelime! 🚨</div>
            )}
          </div>

          {/* ... MEME VE MESAJ YAZMA KISMI AYNI ... */}
          <div className="p-3 bg-background/50 border-t border-primary/20 flex gap-2 items-center backdrop-blur-md">
            <button onClick={() => setShowMemeMenu(!showMemeMenu)} className="w-10 h-10 rounded-xl bg-card border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors">🎵</button>
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Mesaj yaz..." className={`flex-1 bg-card border-2 ${errorAnim ? 'border-red-500 bg-red-500/10' : 'border-primary/20'} text-text rounded-xl px-4 py-3 outline-none focus:border-primary transition-all duration-300 placeholder:text-text/30 font-medium text-sm`} />
            <button onClick={() => handleSend()} className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform shrink-0">➤</button>
          </div>
        </div>
      )}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-primary text-background rounded-full flex items-center justify-center text-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 animate-bounce">💬</button>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}