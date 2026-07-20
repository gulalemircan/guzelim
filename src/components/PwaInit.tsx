"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PwaInit() {
  useEffect(() => {
    // Sadece tarayıcı ortamında ve service worker destekleniyorsa çalıştır[cite: 7]
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(async (registration) => {
          console.log('Arka plan motoru (SW) başarıyla kuruldu:', registration.scope); //[cite: 7]
          
          // YENİ: Site açılır açılmaz sessizce bildirim izni ister
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            const savedName = localStorage.getItem("myName"); 
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            
            if (!savedName || !vapidPublicKey) return;

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
              });
            }

            // Cihaz adresini Supabase'e kaydet (Daha önce kaydedilmemişse)
            if (subscription) {
              const subString = JSON.stringify(subscription);
              const { data: existing } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_name', savedName);
              
              const alreadySaved = existing?.some(e => JSON.stringify(e.subscription) === subString);
              
              if (!alreadySaved) {
                 await supabase.from('push_subscriptions').insert([{ 
                   user_name: savedName, 
                   subscription: JSON.parse(subString) 
                 }]);
              }
            }
          }
        })
        .catch((error) => {
          console.log('Arka plan motoru kurulamadı:', error); //[cite: 7]
        });
    }
  }, []);

  return null; // Ekranda hiçbir şey göstermeyecek, sadece arka planda çalışacak[cite: 7]
}

// YENİ: Şifreyi telefonun anlayacağı formata çeviren yardımcı fonksiyon
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