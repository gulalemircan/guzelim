"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { playSound } from "@/utils/audio";
import { supabase } from "@/lib/supabaseClient";
import TimeCapsule from "@/components/TimeCapsule";

const getWeatherDetails = (code: number) => {
  if (code === 0) return { condition: "Açık", icon: "☀️", type: "clear" };
  if (code === 1 || code === 2 || code === 3) return { condition: "Parçalı Bulutlu", icon: "⛅", type: "cloudy" };
  if (code >= 51 && code <= 67) return { condition: "Yağmurlu", icon: "🌧️", type: "rain" };
  if (code >= 71 && code <= 77) return { condition: "Karlı", icon: "❄️", type: "snow" };
  if (code >= 95 && code <= 99) return { condition: "Fırtınalı", icon: "⛈️", type: "thunder" };
  return { condition: "Bulutlu", icon: "☁️", type: "unknown" };
};

const MOODS = [
  { emoji: "🥰", text: "Çok Mutlu" },
  { emoji: "🥺", text: "Seni Özledi" },
  { emoji: "😭", text: "Biraz Duygusal" },
  { emoji: "😴", text: "Çok Yorgun" },
  { emoji: "🤩", text: "Heyecanlı" },
  { emoji: "😠", text: "Biraz Sinirli" }
];

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  
  // Kimlik ve Ruh Hali State'leri
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [efsunMood, setEfsunMood] = useState({ emoji: "🥰", text: "Çok Mutlu" });
  const [showMoodModal, setShowMoodModal] = useState(false);
  
  // Sayaç State'leri
  const [relDays, setRelDays] = useState(0);
  const [relHours, setRelHours] = useState(0);
  const [relMinutes, setRelMinutes] = useState(0);
  const [relSeconds, setRelSeconds] = useState(0);

  const [meetDays, setMeetDays] = useState(0);
  const [meetHours, setMeetHours] = useState(0);
  const [meetMinutes, setMeetMinutes] = useState(0);
  const [meetSeconds, setMeetSeconds] = useState(0);

  const [annivData, setAnnivData] = useState({ 
    relMonth: 0, isRelToday: false, relCd: { d: 0, h: 0, m: 0, s: 0 },
    meetMonth: 0, isMeetToday: false, meetCd: { d: 0, h: 0, m: 0, s: 0 },
    totalMeetDays: 0
  });

  // Hava Durumu State'leri
  const [currentWeather, setCurrentWeather] = useState<{temp: number, code: number} | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);
  const [dailyForecast, setDailyForecast] = useState<any[]>([]);
  const [weatherStatus, setWeatherStatus] = useState("Uyduya Bağlanıyor...");

  useEffect(() => {
    setIsClient(true);

    // KİMLİK KONTROLÜ (Giriş ekranında atadığın "myName" çekilir)
    const storedUser = localStorage.getItem('myName');
    setCurrentUser(storedUser);

    // RUH HALİNİ İLK AÇILIŞTA ÇEK
    const fetchMood = async () => {
      const { data } = await supabase.from('efsun_mood').select('*').eq('id', 1).single();
      if (data) {
        setEfsunMood({ emoji: data.emoji, text: data.text });
      } else {
        await supabase.from('efsun_mood').upsert([{ id: 1, emoji: "🥰", text: "Çok Mutlu" }]);
      }
    };
    fetchMood();

    // CANLI (REALTIME) BAĞLANTI: Sayfayı yenilemeden güncellemek için
    const moodSubscription = supabase
      .channel('efsun_mood_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'efsun_mood' }, (payload) => {
        if (payload.new) {
          setEfsunMood({ emoji: payload.new.emoji, text: payload.new.text });
        }
      })
      .subscribe();

    // SAYAÇLAR
    const relationStartDate = new Date("2026-01-13T00:00:00").getTime(); 
    const meetStartDate = new Date("2025-12-07T00:00:00").getTime();

    const updateCounters = () => {
      const now = new Date();
      
      const diffRel = now.getTime() - relationStartDate;
      setRelDays(Math.floor(diffRel / (1000 * 60 * 60 * 24)));
      setRelHours(Math.floor((diffRel % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setRelMinutes(Math.floor((diffRel % (1000 * 60 * 60)) / (1000 * 60)));
      setRelSeconds(Math.floor((diffRel % (1000 * 60)) / 1000));

      const diffMeet = now.getTime() - meetStartDate;
      setMeetDays(Math.floor(diffMeet / (1000 * 60 * 60 * 24)));
      setMeetHours(Math.floor((diffMeet % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMeetMinutes(Math.floor((diffMeet % (1000 * 60 * 60)) / (1000 * 60)));
      setMeetSeconds(Math.floor((diffMeet % (1000 * 60)) / 1000));
      const totalMeetDaysCount = Math.floor(diffMeet / (1000 * 60 * 60 * 24));

      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let nextRelDate = new Date(now.getFullYear(), now.getMonth(), 13);
      if (todayMidnight.getTime() > nextRelDate.getTime()) nextRelDate.setMonth(nextRelDate.getMonth() + 1);
      const rMonth = (nextRelDate.getFullYear() - 2026) * 12 + (nextRelDate.getMonth() - 0) + 1; 
      const relDiffForMini = nextRelDate.getTime() - now.getTime();
      
      let rCd = { d: 0, h: 0, m: 0, s: 0 };
      if (todayMidnight.getTime() !== nextRelDate.getTime() && relDiffForMini > 0) {
        rCd.d = Math.floor(relDiffForMini / (1000 * 60 * 60 * 24));
        rCd.h = Math.floor((relDiffForMini % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        rCd.m = Math.floor((relDiffForMini % (1000 * 60 * 60)) / (1000 * 60));
        rCd.s = Math.floor((relDiffForMini % (1000 * 60)) / 1000);
      }

      let nextMeetDate = new Date(now.getFullYear(), now.getMonth(), 7);
      if (todayMidnight.getTime() > nextMeetDate.getTime()) nextMeetDate.setMonth(nextMeetDate.getMonth() + 1);
      const mMonth = (nextMeetDate.getFullYear() - 2025) * 12 + (nextMeetDate.getMonth() - 11) + 1; 
      const meetDiffForMini = nextMeetDate.getTime() - now.getTime();
      
      let mCd = { d: 0, h: 0, m: 0, s: 0 };
      if (todayMidnight.getTime() !== nextMeetDate.getTime() && meetDiffForMini > 0) {
        mCd.d = Math.floor(meetDiffForMini / (1000 * 60 * 60 * 24));
        mCd.h = Math.floor((meetDiffForMini % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        mCd.m = Math.floor((meetDiffForMini % (1000 * 60 * 60)) / (1000 * 60));
        mCd.s = Math.floor((meetDiffForMini % (1000 * 60)) / 1000);
      }

      setAnnivData({ 
        relMonth: rMonth, isRelToday: todayMidnight.getTime() === nextRelDate.getTime(), relCd: rCd, 
        meetMonth: mMonth, isMeetToday: todayMidnight.getTime() === nextMeetDate.getTime(), meetCd: mCd,
        totalMeetDays: totalMeetDaysCount
      });
    };

    updateCounters();
    const timer = setInterval(updateCounters, 1000);

    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=37.37&longitude=36.10&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto");
        if (!res.ok) throw new Error("Hata");
        const data = await res.json();
        
        setCurrentWeather({ temp: data.current_weather.temperature, code: data.current_weather.weathercode });

        const currentHour = new Date().getHours();
        const nextHours = [];
        for (let i = 1; i <= 5; i++) {
          nextHours.push({
            time: `${(currentHour + i) % 24}:00`, temp: Math.round(data.hourly.temperature_2m[currentHour + i]), code: data.hourly.weathercode[currentHour + i]
          });
        }
        setHourlyForecast(nextHours);

        const nextDays = [];
        const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
        for (let i = 1; i <= 4; i++) {
          const dateObj = new Date(data.daily.time[i]);
          nextDays.push({
            day: dayNames[dateObj.getDay()], max: Math.round(data.daily.temperature_2m_max[i]), min: Math.round(data.daily.temperature_2m_min[i]), code: data.daily.weathercode[i]
          });
        }
        setDailyForecast(nextDays);
        setWeatherStatus("Şu An Kadirli");

      } catch (error) {
        setWeatherStatus("Kadirli (Uydu Hatası)");
      }
    };

    fetchWeather();
    return () => {
      clearInterval(timer);
      supabase.removeChannel(moodSubscription);
    };
  }, []);

  const updateMood = async (selectedMood: { emoji: string, text: string }) => {
    playSound("success");
    setEfsunMood(selectedMood);
    setShowMoodModal(false);
    await supabase.from('efsun_mood').upsert({ id: 1, emoji: selectedMood.emoji, text: selectedMood.text });
  };

  const getPersonalizedMessage = (type: string, temp: number) => {
    if (type === "thunder") return "Dışarıda fırtına ve gök gürültüsü var. Hiç korkma ve endişelenme, ben hep yanındayım. Sadece bana sarıl ve güvende hisset sevgilim... 🤍";
    if (type === "rain") return "Hava yağmurlu. Tam evde battaniye altına girip Me Before You izleme havası! Yanına belki biraz magnolia da çok iyi gider... 🎬🌧️";
    if (temp > 28) return "Bugün hava epey sıcak ve boğucu! Dışarı çıkarsan dikkatli ol. En iyisi buz gibi bir limonata veya Magnum alıp serinlemek sanki, ne dersin? 🍋🍦";
    if (temp < 10) return "Bugün hava epey soğuk. Lütfen dışarı çıkarken sıkı giyin, üşümeni ve hasta olmanı hiç istemem. 🧣❄️";
    return "Harika bir hava var! Dışarı çıkıp o çok sevdiğin lilyumları izleyebilir, bol bol fotoğraf çekebilir veya en sevdiğin müzikleri dinleyerek yürüyüş yapabilirsin. 🌸📸";
  };

  if (!isClient) return <div className="min-h-screen bg-background"></div>;

  return (
    <main className="min-h-screen flex flex-col items-center font-sans px-4 md:px-8 py-10 bg-background relative">

      {/* RUH HALİ DEĞİŞTİRME EKRANI (SADECE EFSUN AÇABİLİR) */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[90] flex items-center justify-center p-4">
          <div className="bg-card border border-primary/40 rounded-[32px] p-6 shadow-2xl flex flex-col animate-in zoom-in-95 w-full max-w-sm">
            <h3 className="display-font text-2xl text-primary mb-6 text-center">Şu an nasılsın bebeğim?</h3>
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map((m, i) => (
                <button 
                  key={i}
                  onClick={() => updateMood(m)}
                  className="bg-background border border-primary/20 py-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/10 transition-all shadow-sm"
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-white text-[11px] uppercase tracking-widest font-bold">{m.text}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowMoodModal(false)}
              className="mt-6 w-full py-3 text-text/50 font-bold hover:text-white transition-colors"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        .animate-heartbeat { animation: heartbeat 1.5s infinite; display: inline-block; }
        .animate-float { animation: float-gentle 3s ease-in-out infinite; display: inline-block; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; display: inline-block; }
      `}} />

      <div className="w-full flex flex-col gap-8 max-w-5xl mx-auto">
        
        {/* TANIŞTIĞIMIZ ZAMAN */}
        <div className="w-full">
          <h2 className="text-primary text-xs font-bold tracking-[2px] uppercase mb-4">TANIŞTIĞIMIZ ZAMAN</h2>
          <div className="w-full bg-card border border-primary/20 rounded-3xl flex flex-col md:flex-row shadow-lg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-primary/20">
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{meetDays}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">GÜN</span>
            </div>
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{meetHours}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SAAT</span>
            </div>
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{meetMinutes}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">DAK</span>
            </div>
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{meetSeconds}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SANİYE</span>
            </div>
          </div>
        </div>

        {/* SEVGİLİ OLDUĞUMUZ ZAMAN */}
        <div className="w-full">
          <h2 className="text-primary text-xs font-bold tracking-[2px] uppercase mb-4">SEVGİLİ OLDUĞUMUZ ZAMAN</h2>
          <div className="w-full bg-card border border-primary/20 rounded-3xl flex flex-col md:flex-row shadow-lg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-primary/20">
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{relDays}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">GÜN</span>
            </div>
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{relHours}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SAAT</span>
            </div>
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{relMinutes}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">DAK</span>
            </div>
            <div className="flex-1 py-8 flex flex-col items-center justify-center">
              <span className="text-white text-4xl font-light mb-2">{relSeconds}</span>
              <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SANİYE</span>
            </div>
          </div>
        </div>

        {/* YAKLAŞAN AY DÖNÜMLERİ */}
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div className="flex-1 flex flex-col">
            <h2 className="text-primary text-xs font-bold tracking-[2px] uppercase mb-4 text-center md:text-left">
              İLİŞKİMİZİN {annivData.relMonth}. AYINA KALAN SÜRE
            </h2>
            <div className="w-full bg-card border border-primary/20 rounded-3xl flex flex-col md:flex-row shadow-lg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-primary/20 h-full">
              {annivData.isRelToday ? (
                <div className="flex-1 py-6 flex items-center justify-center">
                  <span className="text-white text-4xl font-light animate-pulse">BUGÜN 🎉</span>
                </div>
              ) : (
                <>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.relCd.d}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">GÜN</span>
                  </div>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.relCd.h}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SAAT</span>
                  </div>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.relCd.m}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">DAK</span>
                  </div>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.relCd.s}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SAN</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <h2 className="text-primary text-xs font-bold tracking-[2px] uppercase mb-4 text-center md:text-left">
              TANIŞMAMIZIN {annivData.meetMonth}. AYINA KALAN SÜRE
            </h2>
            <div className="w-full bg-card border border-primary/20 rounded-3xl flex flex-col md:flex-row shadow-lg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-primary/20 h-full">
              {annivData.isMeetToday ? (
                <div className="flex-1 py-6 flex items-center justify-center">
                  <span className="text-white text-4xl font-light animate-pulse">BUGÜN 🥂</span>
                </div>
              ) : (
                <>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.meetCd.d}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">GÜN</span>
                  </div>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.meetCd.h}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SAAT</span>
                  </div>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.meetCd.m}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">DAK</span>
                  </div>
                  <div className="flex-1 py-6 flex flex-col items-center justify-center">
                    <span className="text-white text-4xl font-light mb-2">{annivData.meetCd.s}</span>
                    <span className="text-primary/80 text-[10px] font-bold tracking-widest uppercase">SAN</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* EFSUN ŞUAN NASIL? (EFSUN TIKLARSA MENÜ AÇILIR) */}
        <div 
          onClick={() => {
            if (currentUser === "Efsun") {
              playSound("click");
              setShowMoodModal(true);
            }
          }}
          className={`w-full bg-card border border-primary/20 rounded-3xl p-8 shadow-lg flex items-center justify-between mt-2 transition-all ${currentUser === "Efsun" ? "cursor-pointer hover:border-primary/50 hover:scale-[1.02]" : ""}`}
        >
          <div>
            <h2 className="text-primary text-xl font-medium mb-2">Efsun Şuan Nasıl?</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-4xl animate-heartbeat origin-center">{efsunMood.emoji}</span>
              <span className="text-white font-bold text-[17px]">{efsunMood.text}</span>
            </div>
          </div>
          {currentUser === "Efsun" && (
            <div className="text-primary/50 text-sm">Düzenle ✎</div>
          )}
        </div>

        {/* DEVASA HAVA DURUMU İSTASYONU */}
        {currentWeather && (
          <div className="w-full bg-card border border-primary/20 rounded-3xl p-8 shadow-lg flex flex-col">
            <h2 className="text-primary text-xs font-bold tracking-[2px] uppercase mb-6">{weatherStatus}</h2>
            
            <div className="flex items-center gap-6 mb-8 border-b border-primary/10 pb-8">
              <div className={`text-7xl drop-shadow-md ${getWeatherDetails(currentWeather.code).icon === '☀️' ? 'animate-spin-slow' : 'animate-float'}`}>
                {getWeatherDetails(currentWeather.code).icon}
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-3">
                  <span className="text-white text-6xl font-black">{Math.round(currentWeather.temp)}°</span>
                </div>
                <span className="text-primary/80 text-lg font-medium tracking-wide">
                  {getWeatherDetails(currentWeather.code).condition}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-background rounded-2xl p-5 border border-primary/10 shadow-inner">
                <h3 className="text-primary/60 text-[10px] font-bold tracking-widest uppercase mb-4">Önümüzdeki Saatler</h3>
                <div className="flex justify-between">
                  {hourlyForecast.map((hour, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <span className="text-primary/80 text-xs">{hour.time}</span>
                      <span className="text-2xl">{getWeatherDetails(hour.code).icon}</span>
                      <span className="text-white font-bold text-sm">{hour.temp}°</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background rounded-2xl p-5 border border-primary/10 shadow-inner">
                <h3 className="text-primary/60 text-[10px] font-bold tracking-widest uppercase mb-4">Gelecek Günler</h3>
                <div className="flex justify-between">
                  {dailyForecast.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <span className="text-primary/80 text-xs">{day.day}</span>
                      <span className="text-2xl">{getWeatherDetails(day.code).icon}</span>
                      <div className="flex gap-1 text-xs font-bold">
                        <span className="text-white">{day.max}°</span>
                        <span className="text-white/40">{day.min}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-background border border-primary/20 rounded-2xl p-5 text-center shadow-inner">
               <p className="text-primary text-[16px] font-medium italic leading-relaxed">
                 "{getPersonalizedMessage(getWeatherDetails(currentWeather.code).type, currentWeather.temp)}"
               </p>
            </div>
          </div>
        )}

        {/* ZAMAN KAPSÜLÜ */}
        <TimeCapsule />

      </div>
    </main>
  );
}