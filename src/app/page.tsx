"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient"; 

export default function Home() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [step, setStep] = useState<"password" | "identity">("password");
  const router = useRouter();

  // --- SUPABASE TEST FONKSİYONU ---
  const testBaglanti = async () => {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      alert("Hata kanka: Şifreleri veya dosyayı okuyamadı! ❌");
      console.error("Detaylı Hata:", error);
    } else {
      alert("Bağlantı Kurşun Gibi! Supabase devrede! ✅");
      console.log("Gelen Veri:", data);
    }
  };
  // ---------------------------------

  // Kullanıcı daha önce giriş yaptıysa direkt ana sayfaya yönlendir
  useEffect(() => {
    const savedIdentity = localStorage.getItem("myName");
    if (savedIdentity) {
      router.push("/home");
    }
  }, [router]);

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    
    if (val === "1301") {
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setStep("identity"); // Şifre doğruysa kimliğe geç
    } else if (val.length >= 4) {
      setError(true);
      setTimeout(() => {
        setPassword("");
        setError(false);
      }, 1000);
    }
  };

  const handleIdentitySelection = (name: string) => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate([40, 40, 40]);
    }
    // Kimliği hafızaya kaydet ve ana sayfaya geç
    localStorage.setItem("myName", name);
    router.push("/home"); 
  };

  // YENİ EKLENDİ: fixed inset-0 yerine mobil uyumlu dinamik ekran yapısı kullanıldı
  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-5 relative overflow-hidden">
      {step === "password" ? (
        <div className="bg-card p-10 rounded-[30px] border border-white/10 w-[85%] max-w-[400px] text-center shadow-2xl transition-all duration-300">
          <h1 className="display-font text-5xl mb-2 text-text">E & E</h1>
          <p className="opacity-60 mb-8 text-sm">Küçük dünyamıza hoş geldin.</p>
          
          <input 
            type="password" 
            inputMode="numeric" /* Mobilde direkt rakam klavyesini açar */
            pattern="[0-9]*"
            value={password}
            onChange={handlePassword}
            placeholder="Sana özel şifre..." 
            maxLength={4}
            className="w-full border-none bg-[#2a1e1b] text-white p-4 rounded-xl text-xl text-center mb-5 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          
          {error && (
            <div className="text-[#ff6b6b] text-xs mt-[-10px] mb-2 animate-pulse">
              Hatalı şifre, tekrar dene prenses.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card p-10 rounded-[30px] border border-white/10 w-[85%] max-w-[400px] text-center shadow-2xl animate-in zoom-in duration-300">
          <h2 className="display-font text-3xl mb-8">Sen Kimsin?</h2>
          
          <button 
            onClick={() => handleIdentitySelection("Emircan")}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white border-none py-4 px-8 rounded-full font-bold cursor-pointer mb-4 hover:scale-105 transition-transform shadow-lg"
          >
            Ben Emircan 👨‍💻
          </button>
          
          <button 
            onClick={() => handleIdentitySelection("Efsun")}
            className="w-full bg-accent text-black border-none py-4 px-8 rounded-full font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg"
          >
            Ben Efsun 🌸
          </button>
        </div>
      )}

      {/* GİZLİ TEST BUTONU */}
      <button 
        onClick={testBaglanti}
        className="absolute bottom-6 right-6 bg-primary/20 hover:bg-primary/80 text-white/50 hover:text-white p-3 rounded-full text-sm backdrop-blur-sm transition-all duration-300 z-50 cursor-pointer"
        title="Supabase Bağlantısını Test Et"
      >
        🔌
      </button>
    </main>
  );
}