"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

// TAM 300 KELİMELİK DEVASA TABU DESTESİ!
const INITIAL_CARDS = [
  { word: "AŞK", forbidden: ["Sevgi", "Sevgili", "Kalp", "Duygu", "Hissetmek"] },
  { word: "EVLİLİK", forbidden: ["Düğün", "Gelin", "Damat", "Yüzük", "İmza"] },
  { word: "PARİS", forbidden: ["Fransa", "Eyfel", "Şehir", "Başkent", "Romantik"] },
  { word: "SİNEMA", forbidden: ["Film", "Mısır", "İzlemek", "Bilet", "Perde"] },
  { word: "KAHVE", forbidden: ["Çay", "İçmek", "Kafein", "Fincan", "Sabah"] },
  { word: "TATİL", forbidden: ["Deniz", "Kum", "Güneş", "Otel", "Yaz"] },
  { word: "HEDİYE", forbidden: ["Paket", "Sürpriz", "Doğum Günü", "Vermek", "Kutu"] },
  { word: "SARILMAK", forbidden: ["Kollar", "Sıcak", "Özlem", "Sevgi", "Dokunmak"] },
  { word: "KISKANÇLIK", forbidden: ["Kötü", "Duygu", "Sevgili", "Şüphe", "Güven"] },
  { word: "ŞARAP", forbidden: ["İçki", "Kırmızı", "Beyaz", "Kadeh", "Üzüm"] },
  { word: "KAMP", forbidden: ["Çadır", "Ateş", "Orman", "Doğa", "Uyku Tulumu"] },
  { word: "YIL DÖNÜMÜ", forbidden: ["Kutlama", "Tarih", "Sevgili", "Hatırlamak", "Hediye"] },
  { word: "KİTAP", forbidden: ["Okumak", "Sayfa", "Yazar", "Kelimeler", "Kapak"] },
  { word: "MÜZİK", forbidden: ["Şarkı", "Dinlemek", "Ses", "Kulaklık", "Ritim"] },
  { word: "FOTOĞRAF", forbidden: ["Çekmek", "Kamera", "Anı", "Gülümse", "Poz"] },
  { word: "KEDİ", forbidden: ["Miyav", "Tüy", "Pati", "Fare", "Köpek"] },
  { word: "KÖPEK", forbidden: ["Havlamak", "Kemik", "Kulübe", "Sadık", "Kedi"] },
  { word: "ASLAN", forbidden: ["Orman", "Kral", "Yele", "Vahşi", "Kükremek"] },
  { word: "KAPLAN", forbidden: ["Çizgili", "Vahşi", "Kedi", "Yırtıcı", "Orman"] },
  { word: "FİL", forbidden: ["Hortum", "Büyük", "Afrika", "Diş", "Hayvan"] },
  { word: "ZÜRAFA", forbidden: ["Boyun", "Uzun", "Afrika", "Sarı", "Benekli"] },
  { word: "MAYMUN", forbidden: ["Muz", "Ağaç", "Orman", "Şempanze", "Hayvan"] },
  { word: "AYI", forbidden: ["Kış Uykusu", "Bal", "Orman", "Boz", "Kutup"] },
  { word: "TAVŞAN", forbidden: ["Havuç", "Kulak", "Zıplamak", "Hızlı", "Beyaz"] },
  { word: "FARE", forbidden: ["Peynir", "Kedi", "Küçük", "Kapan", "Kuyruk"] },
  { word: "YILAN", forbidden: ["Sürünmek", "Zehir", "Tıslamak", "Sürüngen", "Uzun"] },
  { word: "ÖRÜMCEK", forbidden: ["Ağ", "Böcek", "Sekiz", "Korku", "Hayvan"] },
  { word: "KARTAL", forbidden: ["Kuş", "Uçmak", "Gökyüzü", "Avcı", "Gaga"] },
  { word: "BAYKUŞ", forbidden: ["Gece", "Göz", "Kuş", "Uçmak", "Ağaç"] },
  { word: "YUNUS", forbidden: ["Deniz", "Zeki", "Balık", "Mavi", "Su"] },
  { word: "BALİNA", forbidden: ["Büyük", "Deniz", "Okyanus", "Su", "Mavi"] },
  { word: "TİMSAH", forbidden: ["Sürüngen", "Göl", "Büyük", "Diş", "Yeşil"] },
  { word: "PENGUEN", forbidden: ["Kutup", "Buz", "Kuş", "Siyah Beyaz", "Uçamaz"] },
  { word: "KANGURU", forbidden: ["Avustralya", "Zıplamak", "Yavru", "Kese", "Hayvan"] },
  { word: "İNEK", forbidden: ["Süt", "Ot", "MÖ", "Çiftlik", "Sığır"] },
  { word: "KOYUN", forbidden: ["Yün", "Mee", "Çiftlik", "Kuzu", "Sürü"] },
  { word: "KEÇİ", forbidden: ["İnatçı", "Boynuz", "Süt", "Dağ", "Sürü"] },
  { word: "AT", forbidden: ["Binmek", "Dört Nala", "Kişnemek", "Eyer", "Yele"] },
  { word: "EŞEK", forbidden: ["İnatçı", "Ai", "Yük", "Hayvan", "At"] },
  { word: "TAVUK", forbidden: ["Yumurta", "Gıt Gıt", "Çiftlik", "Kuş", "Horoz"] },
  { word: "HOROZ", forbidden: ["Sabah", "Ötmek", "Ü Ürü Ü", "Tavuk", "Çiftlik"] },
  { word: "ÖRDEK", forbidden: ["Vak Vak", "Göl", "Su", "Kuş", "Yüzmek"] },
  { word: "KAZ", forbidden: ["Ördek", "Kuş", "Göl", "Beyaz", "Su"] },
  { word: "HİNDİ", forbidden: ["Yılbaşı", "Kuş", "Gulu Gulu", "Kırmızı", "Büyük"] },
  { word: "ELMA", forbidden: ["Meyve", "Kırmızı", "Yeşil", "Ağaç", "Kurt"] },
  { word: "ARMUT", forbidden: ["Meyve", "Sarı", "Ağaç", "Tatlı", "Ayı"] },
  { word: "MUZ", forbidden: ["Maymun", "Sarı", "Meyve", "Soymak", "Tatlı"] },
  { word: "ÇİLEK", forbidden: ["Kırmızı", "Meyve", "Yaz", "Tatlı", "Reçel"] },
  { word: "KARPUZ", forbidden: ["Çekirdek", "Kırmızı", "Yaz", "Meyve", "Büyük"] },
  { word: "KAVUN", forbidden: ["Sarı", "Meyve", "Tatlı", "Karpuz", "Yaz"] },
  { word: "ÜZÜM", forbidden: ["Salkım", "Şarap", "Bağ", "Meyve", "Asma"] },
  { word: "PORTAKAL", forbidden: ["Narenciye", "Meyve", "Turuncu", "C Vitamini", "Kış"] },
  { word: "MANDALİNA", forbidden: ["Portakal", "Meyve", "Kış", "Turuncu", "Soymak"] },
  { word: "LİMON", forbidden: ["Ekşi", "Sarı", "Çorba", "C Vitamini", "Ağaç"] },
  { word: "KİRAZ", forbidden: ["Kırmızı", "Meyve", "Sap", "Yaz", "Çekirdek"] },
  { word: "ŞEFTALİ", forbidden: ["Meyve", "Tüylü", "Çekirdek", "Yaz", "Tatlı"] },
  { word: "ERİK", forbidden: ["Yeşil", "Ekşi", "Tuz", "Yaz", "Ağaç"] },
  { word: "KAYISI", forbidden: ["Malatya", "Meyve", "Sarı", "Yaz", "Tatlı"] },
  { word: "İNCİR", forbidden: ["Ağaç", "Meyve", "Tatlı", "Kuru", "Yaz"] },
  { word: "NAR", forbidden: ["Kırmızı", "Taneli", "Ekşi", "Çarşı", "Meyve"] },
  { word: "AYVA", forbidden: ["Sarı", "Boğaz", "Kış", "Meyve", "Tatlı"] },
  { word: "KİVİ", forbidden: ["Yeşil", "Ekşi", "Meyve", "Tropikal", "Tüylü"] },
  { word: "ANANAS", forbidden: ["Tropikal", "Sarı", "Meyve", "Kabuk", "Tatlı"] },
  { word: "AVOKADO", forbidden: ["Yeşil", "Meyve", "Çekirdek", "Salata", "Tropikal"] },
  { word: "DOMATES", forbidden: ["Kırmızı", "Salata", "Sebze", "Yemek", "Salça"] },
  { word: "BİBER", forbidden: ["Acı", "Tatlı", "Sebze", "Yeşil", "Kırmızı"] },
  { word: "PATLICAN", forbidden: ["Mor", "Karnıyarık", "Sebze", "Oturtma", "Musakka"] },
  { word: "SALATALIK", forbidden: ["Yeşil", "Cacık", "Salata", "Sebze", "Uzun"] },
  { word: "SOĞAN", forbidden: ["Ağlamak", "Sarımsak", "Göz", "Sebze", "Yemek"] },
  { word: "SARIMSAK", forbidden: ["Soğan", "Kokmak", "Cacık", "Sebze", "Kastamonu"] },
  { word: "PATATES", forbidden: ["Kızartma", "Cips", "Yemek", "Sebze", "Püre"] },
  { word: "HAVUÇ", forbidden: ["Tavşan", "Turuncu", "Sebze", "Göz", "Salata"] },
  { word: "TURP", forbidden: ["Kırmızı", "Acı", "Salata", "Sebze", "Beyaz"] },
  { word: "KABAK", forbidden: ["Sebze", "Tatlısı", "Yeşil", "Yemek", "Dolma"] },
  { word: "EKMEK", forbidden: ["Fırın", "Hamur", "Buğday", "Yemek", "Bakkal"] },
  { word: "PEYNİR", forbidden: ["Süt", "Kahvaltı", "Beyaz", "Kaşar", "Zeytin"] },
  { word: "SÜT", forbidden: ["İnek", "İçmek", "Beyaz", "Kalsiyum", "Kahvaltı"] },
  { word: "YUMURTA", forbidden: ["Tavuk", "Kahvaltı", "Beyaz", "Sarı", "Omlet"] },
  { word: "ZEYTİN", forbidden: ["Siyah", "Yeşil", "Kahvaltı", "Ağaç", "Yağ"] },
  { word: "TEREYAĞI", forbidden: ["Süt", "Kahvaltı", "Sarı", "Eritmek", "Yemek"] },
  { word: "BAL", forbidden: ["Arı", "Kovan", "Tatlı", "Kahvaltı", "Çiçek"] },
  { word: "REÇEL", forbidden: ["Meyve", "Tatlı", "Kahvaltı", "Kavanoz", "Çilek"] },
  { word: "PEKMEZ", forbidden: ["Üzüm", "Tahin", "Tatlı", "Kahvaltı", "Siyah"] },
  { word: "SUCUK", forbidden: ["Et", "Baharat", "Kayseri", "Kahvaltı", "Yumurta"] },
  { word: "SOSİS", forbidden: ["Et", "Sandviç", "Kahvaltı", "Uzun", "Ketçap"] },
  { word: "PASTIRMA", forbidden: ["Kayseri", "Çemen", "Et", "Kokmak", "Kahvaltı"] },
  { word: "ÇAY", forbidden: ["Demlemek", "Sıcak", "İnce Belli", "Bardak", "Şeker"] },
  { word: "SU", forbidden: ["İçmek", "Şişe", "Bardak", "Yaşam", "Sıvı"] },
  { word: "AYRAN", forbidden: ["Yoğurt", "Su", "Tuz", "İçmek", "Milli"] },
  { word: "MEYVE SUYU", forbidden: ["İçmek", "Elma", "Şeftali", "Kutu", "Sıvı"] },
  { word: "ŞALGAM", forbidden: ["Acı", "Adana", "Kırmızı", "İçecek", "Havuç"] },
  { word: "KOLA", forbidden: ["Asit", "Siyah", "İçecek", "Soğuk", "Şeker"] },
  { word: "GAZOZ", forbidden: ["Asit", "İçecek", "Saydam", "Tatlı", "Kola"] },
  { word: "TENCERE", forbidden: ["Kapak", "Yemek", "Mutfak", "Tava", "Pişirmek"] },
  { word: "TAVA", forbidden: ["Kızartma", "Mutfak", "Yumurta", "Tencere", "Yağ"] },
  { word: "ÇATAL", forbidden: ["Kaşık", "Bıçak", "Yemek", "Mutfak", "Batırmak"] },
  { word: "KAŞIK", forbidden: ["Çorba", "Yemek", "Mutfak", "Çatal", "Ağız"] },
  { word: "BIÇAK", forbidden: ["Kesmek", "Çatal", "Mutfak", "Yemek", "Keskin"] },
  { word: "TABAK", forbidden: ["Yemek", "Mutfak", "Porselen", "Koymak", "Kase"] },
  { word: "BARDAK", forbidden: ["Su", "İçmek", "Cam", "Kupa", "Çay"] },
  { word: "SÜRAHİ", forbidden: ["Su", "Doldurmak", "Bardak", "Cam", "Mutfak"] },
  { word: "ÇAYDANLIK", forbidden: ["Dem", "Alt", "Üst", "Su", "Mutfak"] },
  { word: "CEZVE", forbidden: ["Kahve", "Türk", "Köpük", "Mutfak", "Pişirmek"] },
  { word: "BİLGİSAYAR", forbidden: ["Klavye", "Ekran", "Fare", "İnternet", "Oyun"] },
  { word: "TELEFON", forbidden: ["Aramak", "Mesaj", "Ekran", "Alo", "Şarj"] },
  { word: "TABLET", forbidden: ["Ekran", "Dokunmatik", "Bilgisayar", "Telefon", "İnternet"] },
  { word: "KULAKLIK", forbidden: ["Müzik", "Ses", "Dinlemek", "Kablo", "Kulak"] },
  { word: "TELEVİZYON", forbidden: ["İzlemek", "Kumanda", "Kanal", "Dizi", "Haber"] },
  { word: "KLAVYE", forbidden: ["Yazmak", "Tuş", "Bilgisayar", "Harf", "Fare"] },
  { word: "FARE", forbidden: ["Tıklamak", "Bilgisayar", "Klavye", "Ok", "İmleç"] },
  { word: "EKRAN", forbidden: ["Görüntü", "Bilgisayar", "Telefon", "Televizyon", "Monitör"] },
  { word: "ŞARJ", forbidden: ["Pil", "Batarya", "Telefon", "Kablo", "Elektrik"] },
  { word: "PRİZ", forbidden: ["Elektrik", "Fiş", "Kablo", "Duvar", "Takmak"] },
  { word: "İNTERNET", forbidden: ["Web", "Ağ", "Bağlantı", "Wifi", "Bilgisayar"] },
  { word: "MODEM", forbidden: ["İnternet", "Bağlantı", "Wifi", "Kutu", "Işık"] },
  { word: "OYUN KONSOLU", forbidden: ["Playstation", "Xbox", "Kol", "Oyun", "Oynamak"] },
  { word: "KAMERA", forbidden: ["Video", "Çekmek", "Fotoğraf", "Kayıt", "Lens"] },
  { word: "YAZICI", forbidden: ["Kağıt", "Çıktı", "Mürekkep", "Bilgisayar", "Belge"] },
  { word: "HOPARLÖR", forbidden: ["Ses", "Müzik", "Dinlemek", "Bilgisayar", "Yüksek"] },
  { word: "DRONE", forbidden: ["Uçmak", "Kamera", "Uzaktan Kumanda", "Hava", "Çekim"] },
  { word: "SAAT", forbidden: ["Zaman", "Kol", "Akrep", "Yelkovan", "Dakika"] },
  { word: "ROBOT", forbidden: ["Yapay Zeka", "Makine", "Demir", "Program", "İnsan"] },
  { word: "UYGULAMA", forbidden: ["İndirmek", "Telefon", "Program", "App", "Kullanmak"] },
  { word: "HALI", forbidden: ["Yere", "Sermek", "Kilim", "Oda", "Dokuma"] },
  { word: "PERDE", forbidden: ["Pencere", "Kapatmak", "Güneş", "Kumaş", "Cam"] },
  { word: "KOLTUK", forbidden: ["Oturmak", "Kanepe", "Salon", "Rahat", "Eşya"] },
  { word: "KANEPE", forbidden: ["Koltuk", "Salon", "Oturmak", "Uzanmak", "Eşya"] },
  { word: "YATAK", forbidden: ["Uyumak", "Oda", "Yorgan", "Yastık", "Gece"] },
  { word: "YORGAN", forbidden: ["Örtmek", "Üşümek", "Yatak", "Kış", "Uyku"] },
  { word: "YASTIK", forbidden: ["Baş", "Koymak", "Yatak", "Uyumak", "Yumuşak"] },
  { word: "BATTANİYE", forbidden: ["Üşümek", "Örtmek", "Yorgan", "Kış", "Sıcak"] },
  { word: "DOLAP", forbidden: ["Kıyafet", "Eşya", "Koymak", "Kapak", "Asmak"] },
  { word: "ÇEKMECE", forbidden: ["Dolap", "Açmak", "Eşya", "Koymak", "Kulp"] },
  { word: "OKUL", forbidden: ["Öğrenci", "Öğretmen", "Ders", "Sınıf", "Eğitim"] },
  { word: "HASTANE", forbidden: ["Doktor", "Hasta", "Hemşire", "İlaç", "Muayene"] },
  { word: "BANKA", forbidden: ["Para", "Hesap", "Çekmek", "Kredi Kartı", "Vezne"] },
  { word: "POSTANE", mektup: ["Mektup", "Kargo", "Göndermek", "PTT", "Pul"] },
  { word: "MARKET", forbidden: ["Alışveriş", "Bakkal", "Sepet", "Kasa", "Erzak"] },
  { word: "BAKKAL", forbidden: ["Market", "Ekmek", "Mahalle", "Amca", "Alışveriş"] },
  { word: "ECZANE", forbidden: ["İlaç", "Doktor", "Reçete", "Almak", "Hastane"] },
  { word: "TİYATRO", forbidden: ["Sahne", "Oyuncu", "Oyun", "Perde", "İzlemek"] },
  { word: "LOKANTA", forbidden: ["Yemek", "Restoran", "Garson", "Aşçı", "Hesap"] },
  { word: "KAFE", forbidden: ["Çay", "Kahve", "İçmek", "Oturmak", "Mekan"] },
  { word: "PARK", forbidden: ["Ağaç", "Çocuk", "Oynamak", "Salıncak", "Yeşil"] },
  { word: "ORMAN", forbidden: ["Ağaç", "Yeşil", "Piknik", "Doğa", "Ateş"] },
  { word: "DENİZ", forbidden: ["Su", "Yüzmek", "Mavi", "Kum", "Dalga"] },
  { word: "GÖL", forbidden: ["Su", "Deniz", "Tatlı", "Yuvarlak", "Ördek"] },
  { word: "DAĞ", forbidden: ["Yüksek", "Tırmanmak", "Zirve", "Tepe", "Kar"] },
  { word: "ŞEHİR", forbidden: ["Büyük", "Kalabalık", "Bina", "Köy", "Trafik"] },
  { word: "KÖY", forbidden: ["Şehir", "Hayvan", "Tarım", "Doğa", "Küçük"] },
  { word: "ÜLKE", forbidden: ["Sınır", "Türkiye", "Devlet", "Bayrak", "Başkent"] },
  { word: "UZAY", forbidden: ["Gezegen", "Yıldız", "Dünya", "Boşluk", "Astronot"] },
  { word: "CAMİ", forbidden: ["Namaz", "Müslüman", "İbadet", "Minare", "Hoca"] },
  { word: "MÜZE", forbidden: ["Tarihi", "Eser", "Gezmek", "Sanat", "Eski"] },
  { word: "KÜTÜPHANE", forbidden: ["Kitap", "Okumak", "Sessiz", "Ders", "Çalışmak"] },
  { word: "STADYUM", forbidden: ["Maç", "Futbol", "Taraftar", "Top", "Büyük"] },
  { word: "SPOR SALONU", forbidden: ["Ağırlık", "Koşu", "Fit", "Antrenman", "Kas"] },
  { word: "HAVUZ", forbidden: ["Yüzmek", "Su", "Mayo", "Deniz", "Islak"] },
  { word: "PLAJ", forbidden: ["Kum", "Deniz", "Güneş", "Şezlong", "Yüzmek"] },
  { word: "OTEL", forbidden: ["Tatil", "Kalmak", "Oda", "Resepsiyon", "Yıldız"] },
  { word: "HAVAALANI", forbidden: ["Uçak", "Uçmak", "Yolcu", "Bilet", "Pasaport"] },
  { word: "OTOGAR", forbidden: ["Otobüs", "Yolculuk", "Bilet", "Terminal", "Yolcu"] },
  { word: "DOKTOR", forbidden: ["Hastane", "Hasta", "İlaç", "Reçete", "Beyaz Yaka"] },
  { word: "ÖĞRETMEN", forbidden: ["Okul", "Öğrenci", "Ders", "Sınıf", "Anlatmak"] },
  { word: "MÜHENDİS", forbidden: ["Proje", "Çizim", "Bina", "Bilgisayar", "Meslek"] },
  { word: "POLİS", forbidden: ["Hırsız", "Suçlu", "Silah", "Üniforma", "Karakol"] },
  { word: "ASKER", forbidden: ["Ordu", "Silah", "Vatan", "Nöbet", "Komutan"] },
  { word: "AVUKAT", forbidden: ["Mahkeme", "Dava", "Hakim", "Savunmak", "Adalet"] },
  { word: "HAKİM", forbidden: ["Mahkeme", "Karar", "Avukat", "Tokmak", "Adalet"] },
  { word: "AŞÇI", forbidden: ["Yemek", "Mutfak", "Lokanta", "Pişirmek", "Kep"] },
  { word: "GARSON", forbidden: ["Sipariş", "Lokanta", "Yemek", "Bahşiş", "Getirmek"] },
  { word: "ŞOFÖR", forbidden: ["Araba", "Sürmek", "Kullanmak", "Direksiyon", "Yolcu"] },
  { word: "PİLOT", forbidden: ["Uçak", "Kullanmak", "Gökyüzü", "Havaalanı", "Uçmak"] },
  { word: "KAPTAN", forbidden: ["Gemi", "Deniz", "Sürmek", "Kullanmak", "Yolcu"] },
  { word: "BERBER", forbidden: ["Saç", "Kesmek", "Tıraş", "Erkek", "Makas"] },
  { word: "KUAFÖR", forbidden: ["Kadın", "Saç", "Boya", "Kesmek", "Fön"] },
  { word: "RESSAM", forbidden: ["Resim", "Boya", "Fırça", "Tuval", "Sanat"] },
  { word: "MÜZİSYEN", forbidden: ["Enstrüman", "Şarkı", "Çalmak", "Nota", "Konser"] },
  { word: "ŞARKICI", forbidden: ["Müzik", "Şarkı", "Söylemek", "Mikrofon", "Konser"] },
  { word: "OYUNCU", forbidden: ["Film", "Dizi", "Tiyatro", "Rol", "Sahne"] },
  { word: "YÖNETMEN", forbidden: ["Film", "Kestik", "Motor", "Çekmek", "Kamera"] },
  { word: "SPORCU", forbidden: ["Maç", "Futbol", "Oynamak", "Antrenman", "Sahne"] },
  { word: "ANNE", forbidden: ["Çocuk", "Baba", "Doğurmak", "Kadın", "Aile"] },
  { word: "BABA", forbidden: ["Çocuk", "Anne", "Adam", "Aile", "Erkek"] },
  { word: "KARDEŞ", forbidden: ["Abla", "Abi", "Aile", "Küçük", "Büyük"] },
  { word: "ABİ", forbidden: ["Kardeş", "Erkek", "Büyük", "Aile", "Abla"] },
  { word: "ABLA", forbidden: ["Kardeş", "Kız", "Büyük", "Aile", "Abi"] },
  { word: "DEDE", forbidden: ["Yaşlı", "Baba", "Büyükbaba", "Saç", "Erkek"] },
  { word: "NİNE", forbidden: ["Yaşlı", "Büyükanne", "Anne", "Kadın", "Saç"] },
  { word: "AMCA", forbidden: ["Baba", "Erkek", "Kardeş", "Aile", "Akraba"] },
  { word: "DAYI", forbidden: ["Anne", "Erkek", "Kardeş", "Aile", "Akraba"] },
  { word: "TEYZE", forbidden: ["Anne", "Kız", "Kardeş", "Aile", "Akraba"] },
  { word: "FUTBOL", forbidden: ["Top", "Gol", "Maç", "Krampon", "Saha"] },
  { word: "BASKETBOL", forbidden: ["Pota", "Top", "Zıplamak", "Smaç", "Atmak"] },
  { word: "VOLEYBOL", forbidden: ["File", "Top", "Servis", "Manşet", "Saha"] },
  { word: "TENİS", forbidden: ["Raket", "Top", "Kort", "Vurmak", "File"] },
  { word: "YÜZME", forbidden: ["Havuz", "Su", "Deniz", "Kulaç", "Mayo"] },
  { word: "KOŞU", forbidden: ["Hızlı", "Yarış", "Ayakkabı", "Atlet", "Terlemek"] },
  { word: "GÜREŞ", forbidden: ["Pehlivan", "Spor", "Minder", "Tuş", "Atmak"] },
  { word: "BOKS", forbidden: ["Eldiven", "Vurmak", "Yumruk", "Ring", "Nakavt"] },
  { word: "HALTER", forbidden: ["Kaldırmak", "Ağırlık", "Spor", "Demir", "Güç"] },
  { word: "CİMNASTİK", forbidden: ["Esnek", "Hareket", "Spor", "Takla", "Zıplamak"] },
  { word: "BİSİKLET", forbidden: ["Pedal", "Sürmek", "İki Teker", "Spor", "Tekerlek"] },
  { word: "KAYAK", forbidden: ["Kar", "Dağ", "Kış", "Kızak", "Spor"] },
  { word: "SÖRF", forbidden: ["Deniz", "Dalga", "Tahta", "Su", "Spor"] },
  { word: "PATEN", forbidden: ["Tekerlek", "Ayakkabı", "Kaymak", "Buz", "Spor"] },
  { word: "KAYKAY", forbidden: ["Tahta", "Tekerlek", "Sürmek", "Kaymak", "Spor"] },
  { word: "BİLARDO", forbidden: ["Istaka", "Top", "Masa", "Delik", "Oyun"] },
  { word: "GOLF", forbidden: ["Delik", "Sopa", "Yeşil", "Top", "Spor"] },
  { word: "MASA TENİSİ", forbidden: ["Ping Pong", "Raket", "Top", "File", "Spor"] },
  { word: "SATRANÇ", forbidden: ["Şah", "Vezir", "Piyon", "Oyun", "Siyah Beyaz"] },
  { word: "OKÇULUK", forbidden: ["Ok", "Yay", "Hedef", "Vurmak", "Atmak"] },
  { word: "FİLM", forbidden: ["Sinema", "İzlemek", "Oyuncu", "Patlamış Mısır", "Ekran"] },
  { word: "DİZİ", forbidden: ["Televizyon", "Bölüm", "İzlemek", "Sezon", "Oyuncu"] },
  { word: "BELGESEL", forbidden: ["Hayvan", "Doğa", "İzlemek", "Gerçek", "Bilgi"] },
  { word: "ÇİZGİ FİLM", forbidden: ["Çocuk", "Animasyon", "İzlemek", "Karakter", "Eğlence"] },
  { word: "ANİMASYON", forbidden: ["Bilgisayar", "Çizgi Film", "3D", "İzlemek", "Film"] },
  { word: "HABER", forbidden: ["Spiker", "Televizyon", "Gazete", "Okumak", "Olay"] },
  { word: "YARIŞMA", forbidden: ["Kazanmak", "Program", "Televizyon", "Ödül", "Sunucu"] },
  { word: "KONSER", forbidden: ["Müzik", "Şarkı", "Canlı", "Sahne", "Bilet"] },
  { word: "FESTİVAL", forbidden: ["Müzik", "Eğlence", "Etkinlik", "Çadır", "Konser"] },
  { word: "SERGİ", forbidden: ["Sanat", "Resim", "Müze", "Gezmek", "Ressam"] },
  { word: "TİŞÖRT", forbidden: ["Kısa Kol", "Giyinmek", "Yaz", "Kıyafet", "Pamuk"] },
  { word: "PANTOLON", forbidden: ["Bacak", "Giyinmek", "Kot", "Kıyafet", "Kemer"] },
  { word: "GÖMLEK", forbidden: ["Düğme", "Yaka", "Ütü", "Kıyafet", "Giyinmek"] },
  { word: "KAZAK", forbidden: ["Kış", "Yün", "Sıcak", "Giyinmek", "Kıyafet"] },
  { word: "MONT", forbidden: ["Kış", "Soğuk", "Giyinmek", "Kaban", "Kalın"] },
  { word: "CEKET", forbidden: ["Takım", "Giyinmek", "Düğme", "Kıyafet", "Gömlek"] },
  { word: "HIRKA", forbidden: ["Düğme", "Örgü", "Kış", "Giyinmek", "Üşümek"] },
  { word: "ETEK", forbidden: ["Kadın", "Kıyafet", "Giyinmek", "Kısa", "Uzun"] },
  { word: "ELBİSE", forbidden: ["Kadın", "Tek Parça", "Giyinmek", "Düğün", "Kıyafet"] },
  { word: "ŞORT", forbidden: ["Yaz", "Kısa", "Pantolon", "Giyinmek", "Sıcak"] },
  { word: "ÇORAP", forbidden: ["Ayak", "Ayakkabı", "Giyinmek", "Koku", "Yırtık"] },
  { word: "AYAKKABI", forbidden: ["Ayak", "Giyinmek", "Bağcık", "Yürümek", "Spor"] },
  { word: "TERLİK", forbidden: ["Ev", "Ayak", "Yaz", "Plaj", "Giyinmek"] },
  { word: "ÇİZME", forbidden: ["Kış", "Ayakkabı", "Yağmur", "Uzun", "Ayak"] },
  { word: "BOT", forbidden: ["Kış", "Ayakkabı", "Soğuk", "Kalın", "Ayak"] },
  { word: "ŞAPKA", forbidden: ["Baş", "Güneş", "Takmak", "Yaz", "Korunmak"] },
  { word: "BERE", forbidden: ["Kış", "Baş", "Soğuk", "Örgü", "Takmak"] },
  { word: "ATKI", forbidden: ["Boyun", "Kış", "Soğuk", "Sarmak", "Örgü"] },
  { word: "ELDİVEN", forbidden: ["El", "Kış", "Parmak", "Takmak", "Soğuk"] },
  { word: "KEMER", forbidden: ["Pantolon", "Bel", "Takmak", "Düşmek", "Deri"] },
  { word: "BAŞ", forbidden: ["Vücut", "Kafa", "Saç", "Boyun", "Ağrımak"] },
  { word: "SAÇ", forbidden: ["Baş", "Taramak", "Kesmek", "Kıl", "Siyah"] },
  { word: "GÖZ", forbidden: ["Görmek", "Renk", "Kör", "Gözlük", "Bakmak"] },
  { word: "KULAK", forbidden: ["Duymak", "Ses", "Organ", "İşitmek", "Sağır"] },
  { word: "BURUN", forbidden: ["Koku", "Nefes", "Almak", "Organ", "Mendil"] },
  { word: "AĞIZ", forbidden: ["Yemek", "Konuşmak", "Diş", "Dil", "Organ"] },
  { word: "DİŞ", forbidden: ["Ağız", "Fırçalamak", "Beyaz", "Isırmak", "Çürük"] },
  { word: "DİL", forbidden: ["Tat", "Ağız", "Konuşmak", "Organ", "Lisan"] },
  { word: "BOĞAZ", forbidden: ["Ağrımak", "Yutkunmak", "Boyun", "Öksürmek", "Organ"] },
  { word: "BOYUN", forbidden: ["Baş", "Boğaz", "Atkı", "Vücut", "Organ"] },
  { word: "KIRMIZI", forbidden: ["Renk", "Kan", "Elma", "Bayrak", "Aşk"] },
  { word: "MAVİ", forbidden: ["Renk", "Deniz", "Gökyüzü", "Su", "Göz"] },
  { word: "SARI", forbidden: ["Renk", "Güneş", "Limon", "Muz", "Papatya"] },
  { word: "YEŞİL", forbidden: ["Renk", "Doğa", "Ağaç", "Çimen", "Yaprak"] },
  { word: "TURUNCU", forbidden: ["Renk", "Portakal", "Mandalina", "Havuç", "Karışım"] },
  { word: "MOR", forbidden: ["Renk", "Patlıcan", "Menekşe", "Koyu", "Karışım"] },
  { word: "PEMBE", forbidden: ["Renk", "Kız", "Şeker", "Gül", "Açık Kırmızı"] },
  { word: "KAHVERENGİ", forbidden: ["Renk", "Toprak", "Ağaç", "Çikolata", "Koyu"] },
  { word: "SİYAH", forbidden: ["Renk", "Karanlık", "Gece", "Kömür", "Beyaz"] },
  { word: "BEYAZ", forbidden: ["Renk", "Kar", "Süt", "Temiz", "Siyah"] },
  { word: "YUVARLAK", forbidden: ["Şekil", "Daire", "Top", "Tekerlek", "Köşesiz"] },
  { word: "KARE", forbidden: ["Şekil", "Dört", "Kenar", "Eşit", "Kutu"] },
  { word: "ÜÇGEN", forbidden: ["Şekil", "Üç", "Kenar", "Piramit", "Geometri"] },
  { word: "DİKDÖRTGEN", forbidden: ["Şekil", "Dört", "Kenar", "Uzun", "Kısa"] },
  { word: "OVAL", forbidden: ["Şekil", "Yuvarlak", "Elips", "Yumurta", "Geometri"] },
  { word: "SİLİNDİR", forbidden: ["Şekil", "Boru", "Yuvarlak", "Geometri", "Uzun"] },
  { word: "KÜP", forbidden: ["Şekil", "Kare", "Kutu", "Zar", "Üç Boyutlu"] },
  { word: "KÜRE", forbidden: ["Şekil", "Yuvarlak", "Top", "Dünya", "Üç Boyutlu"] },
  { word: "KONİ", forbidden: ["Şekil", "Dondurma", "Külah", "Şapka", "Üçgen"] },
  { word: "PİRAMİT", forbidden: ["Mısır", "Firavun", "Üçgen", "Tarihi", "Şekil"] },
  { word: "GÜNEŞ", forbidden: ["Sıcak", "Sarı", "Gökyüzü", "Yaz", "Isıtmak"] },
  { word: "AY", forbidden: ["Gece", "Gökyüzü", "Yıldız", "Dünya", "Uydu"] },
  { word: "YILDIZ", forbidden: ["Gece", "Gökyüzü", "Parlamak", "Ay", "Uzay"] },
  { word: "BULUT", forbidden: ["Beyaz", "Gökyüzü", "Yağmur", "Hava", "Pamuk"] },
  { word: "YAĞMUR", forbidden: ["Su", "Islanmak", "Bulut", "Gökyüzü", "Şemsiye"] },
  { word: "KAR", forbidden: ["Beyaz", "Kış", "Soğuk", "Yağmak", "Adam"] },
  { word: "RÜZGAR", forbidden: ["Esnek", "Hava", "Fırtına", "Uçurmak", "Serin"] },
  { word: "FIRTINA", forbidden: ["Rüzgar", "Şiddetli", "Yağmur", "Korkunç", "Hava"] },
  { word: "ŞİMŞEK", forbidden: ["Çakmak", "Gök Gürültüsü", "Yağmur", "Işık", "Korkmak"] },
  { word: "YILDIRIM", forbidden: ["Düşmek", "Elektrik", "Şimşek", "Gökyüzü", "Ağaç"] },
  { word: "MUTLULUK", forbidden: ["Sevinç", "Gülmek", "Duygu", "Güzel", "Huzur"] },
  { word: "ÜZÜNTÜ", forbidden: ["Ağlamak", "Gözyaşı", "Duygu", "Kötü", "Mutsuz"] },
  { word: "KORKU", forbidden: ["Korkmak", "Endişe", "Karanlık", "Duygu", "Kaçmak"] },
  { word: "ÖFKE", forbidden: ["Kızmak", "Sinir", "Duygu", "Bağırmak", "Kötü"] },
  { word: "ŞAŞKINLIK", forbidden: ["Şaşırmak", "Beklenmedik", "Sürpriz", "Duygu", "Göz"] },
  { word: "HEYECAN", forbidden: ["Kalp", "Çarpmak", "Beklemek", "Duygu", "Hızlı"] },
  { word: "CESARET", forbidden: ["Korkusuz", "Kahraman", "Duygu", "Atılmak", "Güç"] },
  { word: "UMUT", forbidden: ["Beklemek", "İstemek", "Duygu", "Gelecek", "Hayal"] },
  { word: "SEVGİ", forbidden: ["Aşk", "Hoşlanmak", "Duygu", "Kalp", "Değer"] },
  { word: "NEFRET", forbidden: ["Kötü", "Duygu", "Kızmak", "Sevmemek", "Düşman"] },
  { word: "NİŞAN", forbidden: ["Yüzük", "Evlilik", "Söz", "Tören", "Takmak"] },
  { word: "SÖZ", forbidden: ["Nişan", "Yüzük", "Kesmek", "Evlilik", "Aile"] },
  { word: "KINA", forbidden: ["Gece", "Yakmak", "Düğün", "Kırmızı", "Ağlamak"] },
  { word: "YOLCULUK", forbidden: ["Seyahat", "Gitmek", "Araba", "Otobüs", "Tatil"] },
  { word: "SEYAHAT", forbidden: ["Yolculuk", "Gitmek", "Tatil", "Gezmek", "Ülke"] },
  { word: "BİLET", forbidden: ["Almak", "Uçak", "Otobüs", "Sinema", "Gişe"] },
  { word: "PASAPORT", forbidden: ["Yurtdışı", "Ülke", "Gezmek", "Vize", "Defter"] },
  { word: "VİZE", forbidden: ["Pasaport", "Ülke", "Almak", "Girmek", "İzin"] },
  { word: "VALİZ", forbidden: ["Bavul", "Eşya", "Koymak", "Yolculuk", "Tatil"] },
  { word: "BAVUL", forbidden: ["Valiz", "Eşya", "Seyahat", "Koymak", "Büyük"] },
  { word: "ÇANTA", forbidden: ["Eşya", "Koymak", "Sırt", "Kol", "Taşımak"] },
  { word: "CÜZDAN", forbidden: ["Para", "Kredi Kartı", "Koymak", "Çanta", "Cep"] },
  { word: "PARA", forbidden: ["Kazanmak", "Harcamak", "Cüzdan", "Banka", "Zengin"] },
  { word: "KREDİ KARTI", forbidden: ["Para", "Banka", "Çekmek", "Ödemek", "Plastik"] },
  { word: "FATURA", forbidden: ["Ödemek", "Su", "Elektrik", "Kağıt", "Para"] },
  { word: "KASA", forbidden: ["Market", "Para", "Ödemek", "Sıra", "Fiş"] }
];

export default function TabooPage() {
  const [phase, setPhase] = useState<"settings" | "playing" | "finalResult">("settings");
  
  // Oyun Ayarları ve Veriler
  const [allCards, setAllCards] = useState<any[]>([]);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase Skorları
  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [selectedPlayer, setSelectedPlayer] = useState<"Emircan" | "Efsun" | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // 1. Liderlik Tablosunu Çek (TOPLAM DOĞRU SAYISINI BAZ ALIR)
    const { data: scoresData } = await supabase.from('game_scores').select('*').eq('game_name', 'taboo');
    if (scoresData) {
      const emircanScores = scoresData.filter(d => d.player_name === 'Emircan').map(d => d.score);
      const efsunScores = scoresData.filter(d => d.player_name === 'Efsun').map(d => d.score);
      setLeaderboard({
        emircan: emircanScores.length ? emircanScores.reduce((a, b) => a + b, 0) : 0,
        efsun: efsunScores.length ? efsunScores.reduce((a, b) => a + b, 0) : 0,
      });
    }

    // 2. Tabu Kelimelerini Çek
    const { data: cardsData } = await supabase.from('taboo_cards').select('*');
    
    if (!cardsData || cardsData.length < 250) {
      // YENİ: Eğer veritabanında kelime azsa (önceki sürümse), direkt yeni devasa desteyi kullanır
      setAllCards(INITIAL_CARDS);
      // Arka planda DB'yi güncelle
      if (!cardsData || cardsData.length === 0) {
         supabase.from('taboo_cards').insert(INITIAL_CARDS).then();
      }
    } else {
      setAllCards(cardsData);
    }
    
    setIsLoading(false);
  };

  // Zamanlayıcı
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "playing" && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
        if (timeLeft <= 5) playSound("tick");
      }, 1000);
    } else if (phase === "playing" && timeLeft === 0) {
      playSound("over");
      setPhase("finalResult");
    }
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  const startGame = () => {
    if (!selectedPlayer || allCards.length === 0) return;
    playSound("start");
    // Kelimeleri karıştır
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentCardIndex(0);
    setScore(0);
    setTimeLeft(timeLimit);
    setIsSaved(false);
    setPhase("playing");
  };

  const nextCard = () => {
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Kelimeler biterse başa dön ve tekrar karıştır
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      setShuffledCards(shuffled);
      setCurrentCardIndex(0);
    }
  };

  const handleCorrect = () => {
    playSound("success");
    setScore(s => s + 1);
    nextCard();
  };

  const handleTaboo = () => {
    playSound("click");
    // YENİ: Eksi puan kaldırıldı, sadece pas geçilmiş gibi 0 puan verilir. (Kazanma mantığı)
    nextCard();
  };

  const handlePass = () => {
    playSound("click");
    nextCard();
  };

  const saveScoreToDatabase = async () => {
    if (!selectedPlayer || isSaved) return;
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'taboo',
      player_name: selectedPlayer,
      score: score
    }]);
    setIsSaved(true);
    fetchData(); // Skorları hemen güncelle
  };

  const currentCard = shuffledCards[currentCardIndex];

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-bold animate-pulse">Veritabanı Yükleniyor...</div>;
  }

  return (
    <main className="p-5 animate-in fade-in duration-500 pb-24 min-h-screen flex flex-col relative overflow-hidden">
      
      {/* ÜST MENÜ */}
      <div className="flex items-center mb-4 z-10">
        <Link href="/games" onClick={() => playSound("click")} className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
          <span>←</span> Oyunlar
        </Link>
      </div>

      {/* --- 1. AYARLAR VE LİDERLİK TABLOSU --- */}
      {phase === "settings" && (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-5 max-w-md mx-auto w-full z-10">
          <div className="text-center mb-2">
            <div className="text-6xl mb-2 drop-shadow-lg">🗣️</div>
            <h2 className="display-font text-4xl text-primary">Tabu</h2>
            <p className="text-text/70 text-sm mt-2">Yasaklı kelimeleri kullanmadan anlat bakalım!</p>
            <p className="text-primary/60 text-xs mt-1 font-bold">Havuzda {allCards.length} kelime var.</p>
          </div>

          {/* LİDERLİK TABLOSU */}
          <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold mb-1">Emircan (Toplam)</span>
              <span className="text-4xl font-black text-primary">{leaderboard.emircan}</span>
            </div>
            <div className="text-2xl opacity-50 flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-bold">DOĞRULAR</span>
               ⚔️
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold mb-1">Efsun (Toplam)</span>
              <span className="text-4xl font-black text-primary">{leaderboard.efsun}</span>
            </div>
          </div>
          
          <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            
            {/* Süre Seçimi */}
            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Süre Seçimi</label>
              <div className="flex gap-2">
                {[60, 90, 120].map(time => (
                  <button 
                    key={time}
                    onClick={() => { setTimeLimit(time); playSound("click"); }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${timeLimit === time ? 'bg-primary text-background scale-105 shadow-md' : 'bg-background border border-primary/20 text-text/70 hover:border-primary/50'}`}
                  >
                    {time}s
                  </button>
                ))}
              </div>
            </div>

            {/* Oyuncu Seçimi */}
            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block">Şu An Kim Anlatıyor?</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedPlayer("Emircan"); playSound("click"); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayer === "Emircan" ? 'bg-primary text-background shadow-md scale-105' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  Emircan
                </button>
                <button 
                  onClick={() => { setSelectedPlayer("Efsun"); playSound("click"); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayer === "Efsun" ? 'bg-primary text-background shadow-md scale-105' : 'bg-background border border-primary/20 text-text/70'}`}
                >
                  Efsun
                </button>
              </div>
            </div>

          </div>

          <button 
            onClick={startGame} 
            disabled={!selectedPlayer || allCards.length === 0}
            className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg disabled:opacity-50"
          >
            Süreyi Başlat 🚀
          </button>
        </div>
      )}

      {/* --- 2. OYUN EKRANI --- */}
      {phase === "playing" && currentCard && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300 w-full max-w-md mx-auto">
          
          {/* Üst Bilgi Çubuğu (Süre ve Skor) */}
          <div className="w-full flex justify-between items-center mb-6 px-2">
            <div className="bg-card border border-primary/20 px-4 py-2 rounded-2xl flex flex-col items-center shadow-md">
              <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold">Skor</span>
              <span className="text-2xl font-black text-primary">{score}</span>
            </div>
            
            <div className={`px-6 py-2 rounded-full font-black text-3xl shadow-xl flex items-center gap-2 transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-primary text-background'}`}>
              ⏱️ {timeLeft}
            </div>
          </div>

          {/* TABU KARTI */}
          <div className="bg-card w-full rounded-[40px] shadow-2xl border-2 border-primary/30 flex flex-col items-center overflow-hidden mb-8 relative">
            
            {/* Kart Üst (Anlatılacak Kelime) */}
            <div className="w-full bg-primary/10 py-10 flex items-center justify-center border-b-2 border-primary/20">
              <h2 className="display-font text-5xl text-primary font-black tracking-wider text-center px-4">
                {currentCard.word}
              </h2>
            </div>

            {/* Yasaklı Kelimeler */}
            <div className="w-full py-8 px-6 flex flex-col gap-4 bg-card relative">
              <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center text-9xl">🚫</div>
              {currentCard.forbidden.map((word: string, index: number) => (
                <div key={index} className="w-full bg-background border border-red-500/20 py-3 rounded-xl flex items-center justify-center">
                  <span className="text-red-400 font-bold tracking-widest uppercase text-lg">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BUTONLAR (Tabu, Pas, Doğru) */}
          <div className="flex w-full gap-3 px-2">
            <button onClick={handleTaboo} className="flex-1 bg-red-500/10 border-2 border-red-500 text-red-500 py-4 rounded-2xl font-black text-lg hover:bg-red-500 hover:text-white transition-colors flex flex-col items-center justify-center shadow-lg active:scale-95">
              <span>TABU</span>
              <span className="text-xs opacity-80">0 Puan</span>
            </button>
            <button onClick={handlePass} className="flex-1 bg-background border-2 border-primary/30 text-text/70 py-4 rounded-2xl font-black text-lg hover:border-primary/60 transition-colors flex flex-col items-center justify-center shadow-lg active:scale-95">
              <span>PAS</span>
              <span className="text-xs opacity-80">0 Puan</span>
            </button>
            <button onClick={handleCorrect} className="flex-1 bg-green-500/10 border-2 border-green-500 text-green-500 py-4 rounded-2xl font-black text-lg hover:bg-green-500 hover:text-white transition-colors flex flex-col items-center justify-center shadow-lg active:scale-95">
              <span>DOĞRU</span>
              <span className="text-xs opacity-80">+1 Puan</span>
            </button>
          </div>
        </div>
      )}

      {/* --- 3. OYUN SONU VE KAYDETME --- */}
      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full">
          <div className="text-7xl mb-4 drop-shadow-lg">⏳</div>
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">Süre Doldu!</h2>
          <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
            {selectedPlayer}, bu turdaki toplam net skorun:
          </p>

          <div className="bg-card border border-primary/30 w-full p-8 rounded-[32px] shadow-2xl flex flex-col items-center mb-6">
            <h3 className="display-font text-7xl text-primary font-black drop-shadow-sm">{score}</h3>
            <span className="text-xs uppercase tracking-widest text-text/50 mt-3 font-bold">Toplam Puan</span>
          </div>

          {!isSaved ? (
             <button 
              onClick={saveScoreToDatabase}
              className="w-full bg-primary text-background py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform text-lg mb-6"
            >
              Skoru {selectedPlayer} Adına Kaydet 💾
            </button>
          ) : (
            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-2xl font-bold text-center mb-6">
              Skor başarıyla kaydedildi! ✅
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => { setPhase("settings"); playSound("click"); }} className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg">
              🔄 Başka Bir Tur Oyna
            </button>
            
            <Link href="/games" onClick={() => playSound("click")} className="w-full bg-card border border-primary/20 text-text/80 p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg text-center flex items-center justify-center gap-2">
              🎮 Oyunlar Menüsü
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}