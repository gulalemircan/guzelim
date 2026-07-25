"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type CapsuleData = {
  id: number;
  message: string;
  unlock_date: string;
};

export default function TimeCapsule() {
  const [capsules, setCapsules] = useState<CapsuleData[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // Düzenleme State'leri
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editDate, setEditDate] = useState("");

  // Sayaç State'leri
  const [timeLefts, setTimeLefts] = useState<Record<number, any>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('myName');
    setCurrentUser(storedUser);
    
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    const { data } = await supabase.from('time_capsule').select('*').in('id', [1, 2]);
    let fetched = data || [];
    
    // 1 Numara Emircan'ın, 2 Numara Efsun'un Mektubu
    const cap1 = fetched.find(c => c.id === 1) || {
      id: 1, 
      message: "Canım Efsun...\n\nEğer bu mektubu okuyorsan, o beklediğimiz gün gelmiş demektir. İyi ki benimlesin... 🤍", 
      unlock_date: new Date(new Date().getTime() + 86400000).toISOString()
    };
    
    const cap2 = fetched.find(c => c.id === 2) || {
      id: 2, 
      message: "Canım Emircan...\n\nBu mektubu okuyorsan zamanı gelmiş demektir. Seni çok seviyorum... 🤍", 
      unlock_date: new Date(new Date().getTime() + 86400000).toISOString()
    };

    if (fetched.length < 2) {
      await supabase.from('time_capsule').upsert([cap1, cap2]);
    }
    
    setCapsules([cap1, cap2]);
  };

  const calculateTimeLefts = (caps: CapsuleData[]) => {
    const now = new Date().getTime();
    const newTl: any = {};
    
    caps.forEach(cap => {
      const diff = new Date(cap.unlock_date).getTime() - now;
      if (diff > 0) {
        newTl[cap.id] = {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        };
      } else {
        newTl[cap.id] = null; // Süre doldu (Mektup Açık)
      }
    });
    setTimeLefts(newTl);
  };

  useEffect(() => {
    if (capsules.length === 0) return;
    
    calculateTimeLefts(capsules);
    const timer = setInterval(() => {
      calculateTimeLefts(capsules);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [capsules]);

  const startEditing = (id: number) => {
    const c = capsules.find(cap => cap.id === id);
    if(c) {
      setEditMessage(c.message);
      const dateObj = new Date(c.unlock_date);
      const localIso = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setEditDate(localIso);
      setEditingId(id);
    }
  };

  const handleSave = async (id: number) => {
    try {
      const utcDate = new Date(editDate).toISOString();
      
      const { error } = await supabase.from('time_capsule').upsert({
        id: id,
        message: editMessage,
        unlock_date: utcDate
      });

      if (error) {
        console.error("Supabase Kayıt Hatası:", error);
        alert("Kaydedilemedi! Lütfen tekrar dene.");
        return;
      }

      setEditingId(null);
      fetchCapsules(); 
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    }
  };

  if (capsules.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-16 mb-8 grid grid-cols-1 md:grid-cols-2 gap-12">
         <div className="h-64 bg-card animate-pulse rounded-[40px]"></div>
         <div className="h-64 bg-card animate-pulse rounded-[40px]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-16 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      {[1, 2].map((id) => {
        const isEmircan = id === 1;
        const owner = isEmircan ? "Emircan" : "Efsun";
        const cap = capsules.find(c => c.id === id);
        const isEditingThis = editingId === id;
        const canEdit = currentUser === owner;
        const tl = timeLefts[id];

        if (!cap) return null;

        return (
          <div key={id} className="relative flex flex-col items-center w-full bg-card/40 p-6 md:p-10 rounded-[40px] border border-primary/20 shadow-xl">
            
            {/* SADECE MEKTUBUN SAHİBİNE GÖZÜKEN AYAR BUTONU */}
            {canEdit && !isEditingThis && (
              <button 
                onClick={() => startEditing(id)}
                className="absolute top-6 right-6 z-50 text-text/30 hover:text-primary transition-colors p-2 text-2xl hover:rotate-90 duration-300"
                title={`${owner} Kapsülünü Düzenle`}
              >
                ⚙️
              </button>
            )}

            <h3 className="text-primary text-xs font-bold tracking-[3px] uppercase mb-10 text-center">
              {owner}'ın Zaman Kapsülü
            </h3>

            {isEditingThis ? (
              // DÜZENLEME MODU
              <div className="bg-card border border-primary/40 rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 w-full">
                <h3 className="display-font text-2xl text-primary mb-2 text-center">Kapsülünü Kur</h3>
                
                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Ne Zaman Açılsın?</label>
                  <input 
                    type="datetime-local" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-background border border-primary/20 text-text rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Mektubun İçeriği</label>
                  <textarea 
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="w-full bg-background border border-primary/20 text-text rounded-xl px-4 py-3 outline-none focus:border-primary transition-all resize-none h-40"
                    placeholder="O güne özel romantik bir şeyler yaz..."
                  ></textarea>
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-3 border border-primary/20 rounded-xl text-text/70 hover:bg-primary/10 transition-colors font-bold">
                    İptal
                  </button>
                  <button onClick={() => handleSave(id)} className="flex-1 py-3 bg-primary text-background rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg">
                    Mühürle 🔒
                  </button>
                </div>
              </div>
            ) : (
              // GÖSTERİM MODU
              <div className="w-full flex flex-col items-center">
                {tl !== null && tl !== undefined ? (
                  // KİLİTLİ MEKTUP ZARFI VE SAYAÇ
                  <>
                    <div className="relative w-full max-w-[280px] aspect-[4/3] bg-[#E8DBBB] rounded-md shadow-2xl overflow-hidden group">
                      <div className="absolute bottom-0 left-0 w-full h-full bg-[#E2D4B2] z-10" style={{ clipPath: 'polygon(0 100%, 50% 50%, 100% 100%)' }}></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-[#DFD1B4] z-10" style={{ clipPath: 'polygon(0 0, 50% 50%, 0 100%)' }}></div>
                      <div className="absolute top-0 right-0 w-full h-full bg-[#DFD1B4] z-10" style={{ clipPath: 'polygon(100% 0, 50% 50%, 100% 100%)' }}></div>
                      <div className="absolute top-0 left-0 w-full h-[60%] bg-[#D5C6A7] origin-top z-20 shadow-[0_5px_10px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:rotate-x-12" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
                      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#8B0000] rounded-full z-30 shadow-[0_4px_15px_rgba(0,0,0,0.4)] flex items-center justify-center border-[3px] border-[#660000] transition-transform duration-300 group-hover:scale-105">
                        <span className="text-[#FFD700] text-2xl font-serif italic drop-shadow-md pb-1">E</span>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col items-center bg-background border border-primary/10 p-5 rounded-[24px] shadow-inner w-full max-w-[300px]">
                      <span className="text-primary text-[9px] font-bold tracking-[2px] uppercase mb-4 text-center">
                        Mührün Kırılmasına
                      </span>
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center justify-center w-12">
                          <span className="text-text text-2xl font-light">{tl.days}</span>
                          <span className="text-primary/60 text-[8px] uppercase tracking-wider font-bold mt-1">Gün</span>
                        </div>
                        <span className="text-primary/30 text-xl font-light self-start mt-1">:</span>
                        <div className="flex flex-col items-center justify-center w-12">
                          <span className="text-text text-2xl font-light">{tl.hours}</span>
                          <span className="text-primary/60 text-[8px] uppercase tracking-wider font-bold mt-1">Saat</span>
                        </div>
                        <span className="text-primary/30 text-xl font-light self-start mt-1">:</span>
                        <div className="flex flex-col items-center justify-center w-12">
                          <span className="text-text text-2xl font-light">{tl.minutes}</span>
                          <span className="text-primary/60 text-[8px] uppercase tracking-wider font-bold mt-1">Dk</span>
                        </div>
                        <span className="text-primary/30 text-xl font-light self-start mt-1">:</span>
                        <div className="flex flex-col items-center justify-center w-12">
                          <span className="text-text text-2xl font-light">{tl.seconds}</span>
                          <span className="text-primary/60 text-[8px] uppercase tracking-wider font-bold mt-1">Sn</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // AÇILMIŞ MEKTUP
                  <div className="w-full bg-[#FDFBF7] p-8 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-700">
                    <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.03)] pointer-events-none"></div>
                    <div className="absolute top-4 left-4 text-5xl text-[#8B0000]/10 font-serif">"</div>
                    <p className="text-[#3E2723] font-serif text-base leading-relaxed whitespace-pre-wrap relative z-10 font-medium">
                      {cap.message}
                    </p>
                    <div className="mt-8 text-right relative z-10">
                      <span className="text-[#8B0000] font-serif italic text-lg pr-4 border-b border-[#8B0000]/20 pb-1">
                        {owner}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}