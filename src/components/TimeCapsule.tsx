"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TimeCapsule() {
  const [isEditing, setIsEditing] = useState(false);
  const [capsule, setCapsule] = useState<{ id: number, message: string, unlock_date: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // Form State'leri
  const [editMessage, setEditMessage] = useState("");
  const [editDate, setEditDate] = useState("");

  // Sayaç State'leri
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // SORUN BURADAYDI ÇÖZÜLDÜ: Senin giriş sayfandaki "myName" anahtarını çektik
    const storedUser = localStorage.getItem('myName');
    setCurrentUser(storedUser);
    
    fetchCapsule();
  }, []);

  const fetchCapsule = async () => {
    const { data } = await supabase.from('time_capsule').select('*').eq('id', 1).single();
    if (data) {
      setCapsule(data);
      setEditMessage(data.message || "");
      
      if (data.unlock_date) {
        const dateObj = new Date(data.unlock_date);
        const localIso = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setEditDate(localIso);
      }
    } else {
      const defaultData = {
        id: 1,
        message: "Canım sevgilim...\n\nEğer bu mektubu okuyorsan, o beklediğimiz gün gelmiş demektir. Seni tahmin edemeyeceğin kadar çok seviyorum. İyi ki benimlesin, iyi ki biziz... 🤍",
        unlock_date: new Date(new Date().getTime() + 86400000).toISOString()
      };
      // Eğer tablo boşsa hata vermesin diye upsert kullanıyoruz
      await supabase.from('time_capsule').upsert([defaultData]);
      setCapsule(defaultData);
      setEditMessage(defaultData.message);
      setEditDate(defaultData.unlock_date.slice(0, 16));
    }
  };

  useEffect(() => {
    if (!capsule?.unlock_date) return;

    const timer = setInterval(() => {
      const targetTime = new Date(capsule.unlock_date).getTime();
      const currentTime = new Date().getTime();
      const difference = targetTime - currentTime;

      if (difference > 0) {
        setIsUnlocked(false);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setIsUnlocked(true);
        setTimeLeft(null);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [capsule]);

  const handleSave = async () => {
    try {
      const utcDate = new Date(editDate).toISOString();
      
      // Kaydetmeme sorunu için en güvenli metod UPSERT
      const { error } = await supabase.from('time_capsule').upsert({
        id: 1,
        message: editMessage,
        unlock_date: utcDate
      });

      if (error) {
        console.error("Supabase Kayıt Hatası:", error);
        alert("Kaydedilemedi! Supabase tablosundaki RLS'yi kapatmayı unutmuş olabilir misin?");
        return;
      }

      setIsEditing(false);
      fetchCapsule(); // Ekranı yenile
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    }
  };

  if (!capsule) return <div className="w-full h-32 animate-pulse bg-card rounded-[32px] mt-8"></div>;

  return (
    <div className="w-full max-w-xl mx-auto mt-16 mb-8 relative flex flex-col items-center">
      
      {/* SADECE EMİRCAN'A GÖZÜKEN AYARLAR BUTONU */}
      {currentUser === "Emircan" && !isEditing && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute -top-6 right-0 z-50 text-text/30 hover:text-primary transition-colors p-2 text-2xl hover:rotate-90 duration-300"
          title="Kapsülü Düzenle"
        >
          ⚙️
        </button>
      )}

      {isEditing ? (
        // DÜZENLEME MODU
        <div className="bg-card border border-primary/40 rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 w-full">
          <h3 className="display-font text-2xl text-primary mb-2 text-center">Zaman Kapsülünü Kur</h3>
          
          <div>
            <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Ne Zaman Açılsın?</label>
            <input 
              type="datetime-local" 
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full bg-background border border-primary/20 text-white rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Mektubun İçeriği</label>
            <textarea 
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              className="w-full bg-background border border-primary/20 text-white rounded-xl px-4 py-3 outline-none focus:border-primary transition-all resize-none h-40"
              placeholder="O güne özel romantik bir şeyler yaz..."
            ></textarea>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-primary/20 rounded-xl text-text/70 hover:bg-white/5 transition-colors font-bold">
              İptal
            </button>
            <button onClick={handleSave} className="flex-1 py-3 bg-primary text-background rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg">
              Mühürle & Kaydet 🔒
            </button>
          </div>
        </div>
      ) : (
        // GÖSTERİM MODU
        <div className="w-full flex flex-col items-center">
          {!isUnlocked ? (
            // KİLİTLİ MEKTUP ZARFI
            <>
              <div className="relative w-full max-w-sm aspect-[4/3] bg-[#E8DBBB] rounded-md shadow-2xl overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-full h-full bg-[#E2D4B2] z-10" style={{ clipPath: 'polygon(0 100%, 50% 50%, 100% 100%)' }}></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[#DFD1B4] z-10" style={{ clipPath: 'polygon(0 0, 50% 50%, 0 100%)' }}></div>
                <div className="absolute top-0 right-0 w-full h-full bg-[#DFD1B4] z-10" style={{ clipPath: 'polygon(100% 0, 50% 50%, 100% 100%)' }}></div>
                <div className="absolute top-0 left-0 w-full h-[60%] bg-[#D5C6A7] origin-top z-20 shadow-[0_5px_10px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:rotate-x-12" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#8B0000] rounded-full z-30 shadow-[0_4px_15px_rgba(0,0,0,0.4)] flex items-center justify-center border-[3px] border-[#660000] transition-transform duration-300 group-hover:scale-105">
                  <span className="text-[#FFD700] text-2xl font-serif italic drop-shadow-md pb-1">E</span>
                </div>
              </div>

              {/* SAYAÇ BÖLÜMÜ */}
              {timeLeft && (
                <div className="mt-8 flex flex-col items-center bg-card border border-primary/20 p-6 rounded-[32px] shadow-lg w-full max-w-sm">
                  <span className="text-primary text-[10px] font-bold tracking-[3px] uppercase mb-4 text-center">
                    Mührün Kırılmasına Kalan Süre
                  </span>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center w-14">
                      <span className="text-white text-3xl font-light">{timeLeft.days}</span>
                      <span className="text-primary/60 text-[9px] uppercase tracking-wider font-bold mt-1">Gün</span>
                    </div>
                    <span className="text-primary/30 text-2xl font-light self-start mt-1">:</span>
                    <div className="flex flex-col items-center justify-center w-14">
                      <span className="text-white text-3xl font-light">{timeLeft.hours}</span>
                      <span className="text-primary/60 text-[9px] uppercase tracking-wider font-bold mt-1">Saat</span>
                    </div>
                    <span className="text-primary/30 text-2xl font-light self-start mt-1">:</span>
                    <div className="flex flex-col items-center justify-center w-14">
                      <span className="text-white text-3xl font-light">{timeLeft.minutes}</span>
                      <span className="text-primary/60 text-[9px] uppercase tracking-wider font-bold mt-1">Dk</span>
                    </div>
                    <span className="text-primary/30 text-2xl font-light self-start mt-1">:</span>
                    <div className="flex flex-col items-center justify-center w-14">
                      <span className="text-white text-3xl font-light">{timeLeft.seconds}</span>
                      <span className="text-primary/60 text-[9px] uppercase tracking-wider font-bold mt-1">Sn</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // AÇILMIŞ MEKTUP
            <div className="w-full bg-[#FDFBF7] p-8 md:p-12 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-700">
              <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.03)] pointer-events-none"></div>
              <div className="absolute top-6 left-6 text-5xl text-[#8B0000]/10 font-serif">"</div>
              <p className="text-[#3E2723] font-serif text-lg leading-loose whitespace-pre-wrap relative z-10 font-medium">
                {capsule.message}
              </p>
              <div className="mt-12 text-right relative z-10">
                <span className="text-[#8B0000] font-serif italic text-xl pr-4 border-b border-[#8B0000]/20 pb-1">
                  E & E
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}