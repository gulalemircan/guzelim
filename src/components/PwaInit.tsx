"use client";
import { useEffect } from "react";

export default function PwaInit() {
  useEffect(() => {
    // Sadece tarayıcı ortamında ve service worker destekleniyorsa çalıştır
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Arka plan motoru (SW) başarıyla kuruldu:', registration.scope);
        })
        .catch((error) => {
          console.log('Arka plan motoru kurulamadı:', error);
        });
    }
  }, []);

  return null; // Ekranda hiçbir şey göstermeyecek, sadece arka planda çalışacak
}