"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

// DEVASA KELİME HAVUZU (4, 5, 6 ve 7 harfli tam 400 kelime)
const W4 = "AĞAÇ AKIL ALAN ARAÇ AYAK BABA BACA BANT BARI BATI BERE BİNA BİRA BONE BORU CAMİ CİLT CUMA ÇABA ÇEKİ ÇENE ÇETE ÇİVİ DADI DANS DAYI DELİ DERE DERİ DEVE DİNK DOĞU DOLU DÖRT DUYU EKİM EKİN ELÇİ ELMA EMİR ERİK ESKİ EŞEK ETEK EVLİ FARE FARK FİLO FOTO FUAR GAGA GECE GEMİ GENÇ GERİ GIDA GİŞE GOLF GÖRE GRUP GÜCÜ GÜVE HALI HALK HARF HAVA HECE İÇKİ İĞNE İLKE İMAM İMZA İNAT İNEK İNCİ İSİM KABA KAFA KALE KALP KAMP KAPI KARA KARE KART KASA KATI KEDİ KEÇİ KERE KESE KINA KISA KITA KİLO KİRA KOCA KONU KORU KOVA KREM KUPA KUTU KUZU KÜPE KÜRE LALE LİSE LOCA MASA MAYA MAZİ MEŞE MİDE MİNE MODA MOLA MÜZE NANE NİDA NİNE NOEL NOTA OCAK ODUN OFİS OKUL OLAY ONUR ORAN ORDU ORTA ORUÇ OTEL OTUR OVAL OYUN ÖDÜL ÖFKE ÖĞLE ÖKÜZ ÖLÇÜ ÖMÜR ÖNCÜ ÖRTÜ ÖZEL ÖZET ÖZÜR PANO PARA PARK PAŞA PENA PİDE PİRE PLAN PUAN PUMA RANT RENK RİSK ROTA SAAT SAHA SAKA SALI SARI SATI SAYI SEDA SELE SEMT SERİ SEVİ SIKI SIRA SİTE SOBA SOKU SORU SPOR STAJ SULU SUNU SÜRE SÜRÜ ŞAKA ŞANS ŞART ŞATO ŞEMA ŞEMS ŞİİR ŞİŞE ŞORT ŞUBE ŞURA TAKI TANK TAPI TARZ TAZE TEMA TEPE TERS TEST TREN TUNÇ TURA UÇAK UCUZ UFAK UFUK UĞUR UMAR UMUT URFA USTA UYKU UZAY UZUN ÜMİT ÜNLÜ ÜRÜN ÜSTE ÜZÜM VAAZ VADİ VAKA VALİ VAZO VEDA VELİ VERİ VİNÇ VİZE YAKA YALI YARA YARI YASA YATI YEDİ YENİ YETİ YİNE YOGA YÖRE YUVA YÜCE ZAİL ZEKA ZEKİ ZEVK ZİRA ZOKA ZONA".split(" ");
const W5 = "AKŞAM ASLAN AYLIK BAHÇE BAKIR BALIK BASKI BEYAZ BİBER BİLET BİLGİ BOĞAZ BÖCEK BULUT BÜTÜN CADDE CEVAP CEVİZ CİHAZ ÇADIR ÇAKAL ÇAMUR ÇARŞI ÇATAL ÇEKİÇ ÇELİK ÇİÇEK ÇİZGİ ÇOCUK ÇORAP ÇUBUK DALGA DAMAR DEMİR DENİZ DERİN DİĞER DİKİŞ DİREK DOĞAL DOKUZ DOLAP DOMUZ DÖNEM DUVAR DÜNYA DÜZEN EKRAN ELMAS EMLAK ENGEL ERKEK ERKEN EŞARP ETKİN EYLEM FAKİR FAYDA FENER FİDAN FİKİR FİYAT FİZİK FORMA GARAJ GELİN GENEL GEYİK GİDER GİTAR GİYİM GÖĞÜS GÖRÜŞ GÖVDE GURUR GÜNEŞ GÜZEL HABER HAFİF HAFTA HAKEM HALAT HAMUR HANIM HASAR HASTA HAYAL HAYAT HAYIR HAZIR HEDEF HESAP HIRKA HOROZ HUKUK HURMA HUZUR HÜCRE HÜZÜN IRMAK İDARE İFADE İKLİM İLAVE İLMEK İNSAN İPLİK İPTAL İRADE İŞLEM İŞTAH İZMİR KABAK KABLO KADIN KADRO KAĞIT KAHVE KALEM KALIP KANAL KANAT KAPAK KARAR KARGA KARIN KARIŞ KARŞI KASAP KAŞIK KAVAK KAZAN KEBAP KEFİL KEMİK KENAR KEPÇE KESİM KEŞİF KILIÇ KİMYA KİTAP KLİMA KOBAY KOLAY KOLYE KOMİK KOPYA KORKU KOYUN KÖMÜR KÖPEK KÖPRÜ KREDİ KURAL KURUM KUTLU KUZEY KÜÇÜK KÜLAH MADDE MADEN MAKAM MAKAS MAKET MAKRO MANAV MANTI MARKA MASAL MASKİ MATEM MAYIS MELEK MERMİ MESAJ METAL METİN METRE MEYVE MİMAR MİRAS MODEM MOTOR MUTLU MÜZİK NAKİT NAMUS NEFES NEHİR NELER NESİL NİSAN NOKTA NÖBET NÜFUS OLGUN ORMAN ORTAM ORTAK PALTO PAMUK PANEL PARÇA PARKE PASAJ PASTA PAZAR PERDE PİLOT POLİS PROJE RABIT RAKAM RAKİP RAMAK REÇEL REKOR RESİM ROMAN ROZET SABAH SABIR SAKIZ SALAŞ SALON SANAT SAPIK SARAY SAYGI SEBZE SEÇİM SEDİR SEFER SEHPA SEKİZ SİHİR SİLAH SİLGİ SİMİT SİNİR SİYAH SOKAK SONRA SORUN SÖZLÜ STRES SUÇLU ŞAHİN ŞARKI ŞEHİR ŞEKER ŞİFRE ŞİMDİ ŞOFÖR TABAK TABLO TAHIL TAHMİN TAKIM TALEP TAMAM TARİH TARIM TASARI TAVAN TAVUK TEKİN TELAŞ TEMEL TEPSİ TERİM TEYZE TİLKİ TORBA TÖREN TREND TUĞLA TULUM TURAN TUZLU TÜMCE TÜTÜN UÇMAK UZMAN ÜCRET ÜNİTE ÜRKÜT ÜZÜCÜ ÜZÜRE VAKİT VARLI VASIF VATAN VERGİ VİRÜS VÜCUT YABAN YAĞIN YAHUT YAKIN YALAN YANAK YANIT YANLIŞ YARAR YARIM YASAK YASAL YAŞAM YATAK YAVAŞ YAYIN YAZAR YEDEK YEMEK YEMİN YEREL YEŞİL YETER YILAN YİRMİ YOLCU YORUM YUDUM YUNUS YÜREK YÜZDE ZABIT ZAMAN ZARAR ZEBRA ZEMİN ZİHİN ZORLU ZÜMRE".split(" ");
const W6 = "ADALET AKRABA ALFABE ANKARA AVUKAT BAKKAL BALKON BARDAK BAŞARI BAŞKAN BAYKUŞ BAYRAK BEDAVA BELLEK BENZER BERBER BİLGİN BOLLUK BOŞLUK BOYACI BÖBREK BULGUR BÜLBÜL CAMBAZ CENAZE CENNET CEYLAN CÜZDAN ÇAĞDAŞ ÇARPIM ÇELTİK ÇEMBER ÇEYREK ÇİFTÇİ ÇİĞDEM ÇÖMLEK DALGIÇ DANTEL DAKİKA DERECE DESTEK DEVLET DİKKAT DİRSEK DOKTOR DOKUMA DOSTÇA EFSANE EĞİTİM ELBİSE ENDİŞE ENERJİ ETİKET ETKİLİ FAYANS FINDIK FISTIK FİNCAN GARSON GAZETE GEVŞEK GÖZLÜK GÜNCEL GÜNDÜZ GÜRBÜZ HALTER HANÇER HARİKA HASRET HAYVAN HEDİYE HEYKEL HİZMET İÇECEK İKİNCİ İNŞAAT İSKELE İŞARET KADİFE KAKTÜS KALBUR KALİTE KAMERA KANSER KANYON KAPLAN KAPTAN KARDEŞ KARTAL KAŞAĞI KAUÇUK KAVŞAK KAYMAK KAZANÇ KAZMAÇ KELİME KEMANE KEZZAP KILINÇ KIRBAÇ KOSTÜM KÖFTER KURBAN KUVVET LAAKAL LAHANA LASTİK LEZZET LEYLEK MANTAR MAĞARA MAHSÜL MAKBUL MAKSAT MANDAL MANŞET MATBAA MEHTAP MENDİL MERCEK MERMER MESAFE MESLEK MEVSİM MİKTAR MİNARE MUCİZE MUTFAK NOHUTU ORKİDE OTOBÜS OTOGAR PARLAK PATRON PEYNİR PEÇETE PİYANO PORTRE PROFİL REKLAM RESSAM RÜZGAR SAFARİ SAĞLIK SANDIK SARMAL SAYDAM SENSÖR SEYYAR SİGARA SİNCAP SİSTEM SOHBET SÖZLÜK SÜRAHİ SÜRÜCÜ ŞALGAM ŞELALE TABELA TAKVİM TAVŞAN TAYFUN TEBRİK TELSİZ TEMBEL TENSİL TESPİT TESTER TEZGAH TİMSAH TOPRAK TRAFİK TÜCCAR UZANTI VİCDAN VİTRİN VOLKAN YAPRAK YARDIM YASTIK YAZICI YELEĞİ YILDIZ YORGUN YÖNTEM ZAMBAK ZENGİN ZEYTİN ZİYADE ZODİAK ZÜBÜKL".split(" ");
const W7 = "ABARTMA AĞAÇLIK AKSAMAK ALIŞKAN ANAHTAR ANTALYA ARABACI ARKADAŞ ASANSÖR AVANTAJ AYAKLIK BABADAN BAHARAT BAHÇELİ BAKLAVA BİLARDO BİLECİK BİLGİSİ ÇAMAŞIR ÇEKMECE ÇİLEKLİ DOMATES EĞLENCE EMEKLİK FABRİKA FASULYE GELECEK GELENEK GÖZLEME GÜVENLİ HASTANE HAYALCİ HEYECAN İHTİYAR İLKOKUL İMTİHAN İNTERNET İSPANYA KAHVECİ KALEMLİ KANARYA KARAMEL KARYOLA KASIRGA KESTANE KEREVİZ KORİDOR LOKANTA MAKARNA MALZEME MANZARA MARMARA MENEKŞE MUALLİM OYUNCAK ÖĞRENCİ ÖRÜMCEK PAPATYA PATATES PENCERE PROBLEM PROGRAM SABAHÇI SAKIZLI SALONDA SEMAVER SERMAYE SEYAHAT ŞEMSİYE TARHANA TENCERE TECRÜBE TEHLİKE TELEFON TERCÜME TİYATRO TRABZON TRAKTÖR TÜRKİYE UÇURTMA YABANCI YAKUTÇA YARAMAZ YATIRIM YETENEK YÖNETİM YUMURTA YÜRÜYÜŞ ZİYARET AHTAPOT BAVULCU CANAVAR ERZURUM GEZEGEN GİRİŞİM İLAÇLAR İPLİKÇİ KABARIK KARAKOL KIYAFET SATRANÇ SİGORTA ŞARKICI ŞÖVALYE TOPLUMA VERGİSİ YASAKLI ZİYAFET AMELİYA AYDINLI BİSKÜVİ BOŞANMA BOZUKLU BÜYÜMEK CANLILI ÇEKİRDE ÇEVRİMİ ÇOCUKÇA DAĞILIM DİNAMİK EDEBİYA EKONOMİ ENDÜSTR FELAKET GÖSTERİ GÜZELLİ HAFIZAL İHTİMAL İLETİŞİ İNSANLI İZLENİM JİMLAST KABİLİY KAMPANY KARAKTE KONTROL KORUNMA KULLANI MACERAS MANTIKL MATEMAT MERAKLI MEYDANA MÜDAHAL NİHAYET ORGANİZ ORTAKLI PANDEMİ POLİTİK PROBLEM REKABET SERMAYE SİYASET SOSYALİ STANDAR STRATEJ ŞAHSİYE ŞİKAYET TAHMİNİ TECRÜBE TEKNOLO TEMSİLC TOPLANT UYGULAM ÜRETİCİ YABANCI YAKLAŞI YATIRIM YÖNETİC YÖNETİM ZİHNİYE".split(" ");

const INITIAL_WORDS = [...W4, ...W5, ...W6, ...W7].map(w => ({ word: w }));

const KEYBOARD_ROWS = [
  ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "DEL"]
];

export default function WordlePage() {
  const [phase, setPhase] = useState<"settings" | "playing" | "finalResult">("settings");
  
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [allWords, setAllWords] = useState<any[]>([]);
  const [wordLength, setWordLength] = useState<number>(5);
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  
  // YENİ: Son 5 Maç Geçmişi
  const [recentScores, setRecentScores] = useState<{emircan: number[], efsun: number[]}>({ emircan: [], efsun: [] });
  
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Kimin oynadığını yerel bellekten tanı
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);

    // Liderlik tablosunu ve Son 5 Maçı çek (En yeniler en üstte olacak şekilde id'ye göre tersten sıralıyoruz)
    const { data: scoresData } = await supabase.from('game_scores')
      .select('*')
      .eq('game_name', 'wordle')
      .order('id', { ascending: false }); // Tersten sıralama!

    if (scoresData) {
      const emircanScores = scoresData.filter(d => d.player_name === 'Emircan').map(d => d.score);
      const efsunScores = scoresData.filter(d => d.player_name === 'Efsun').map(d => d.score);
      
      setLeaderboard({
        emircan: emircanScores.length ? Math.max(...emircanScores) : 0,
        efsun: efsunScores.length ? Math.max(...efsunScores) : 0,
      });

      // Son 5 maçı ayır
      setRecentScores({
        emircan: emircanScores.slice(0, 5),
        efsun: efsunScores.slice(0, 5)
      });
    }

    // Kelimeleri Çek / Yoksa Yükle
    const { data: wordsData } = await supabase.from('wordle_words').select('*');
    if (wordsData && wordsData.length >= 350) {
      setAllWords(wordsData);
    } else {
      // Bulutta eksiklik varsa bizim 400 kelimelik efsane desteyi sisteme atar (Arka planda)
      setAllWords(INITIAL_WORDS);
      if (!wordsData || wordsData.length === 0) {
         await supabase.from('wordle_words').insert(INITIAL_WORDS);
      }
    }
    setIsLoading(false);
  };

  const startGame = () => {
    if (allWords.length === 0) return;
    
    const filteredWords = allWords.filter(w => w.word.length === wordLength);
    
    if (filteredWords.length === 0) {
      alert(`Veritabanında ${wordLength} harfli kelime bulunamadı!`);
      return;
    }

    playSound("start");
    
    // Kelimeyi rastgele şeç
    const randomWordObj = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    setTargetWord(randomWordObj.word.toUpperCase());
    
    setGuesses([]);
    setCurrentGuess("");
    setGameStatus("playing");
    setScore(0);
    setIsSaved(false);
    setPhase("playing");
  };

  const onKeyPress = (key: string) => {
    if (gameStatus !== "playing") return;
    playSound("wordle_key");

    if (key === "ENTER") {
      submitGuess();
    } else if (key === "DEL") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else {
      if (currentGuess.length < wordLength) {
        setCurrentGuess(prev => prev + key);
      }
    }
  };

  const submitGuess = () => {
    if (currentGuess.length !== wordLength) return;
    
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    if (currentGuess === targetWord) {
      playSound("success");
      setGameStatus("won");
      calculateScore(newGuesses.length, true);
      setTimeout(() => setPhase("finalResult"), 1500);
    } else if (newGuesses.length === 6) {
      playSound("over");
      setGameStatus("lost");
      calculateScore(6, false);
      setTimeout(() => setPhase("finalResult"), 1500);
    }
  };

  // TERS ORANTILI PUANLAMA MANTIĞI (+1 Artsın, 1. Deneme = 6 Puan ... 6. Deneme = 1 Puan)
  const calculateScore = (attempts: number, won: boolean) => {
    if (!won) {
      setScore(0);
    } else {
      const points = 7 - attempts; // 1. denemede 6, 2. denemede 5, ... 6. denemede 1 puan
      setScore(points);
    }
  };

  const saveScoreToDatabase = async () => {
    if (isSaved) return;
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'wordle',
      player_name: currentUser,
      score: score
    }]);
    setIsSaved(true);
    fetchData(); 
  };

  const getLetterStatus = (letter: string, index: number, guess: string) => {
    const targetLetters = targetWord.split("");
    if (targetLetters[index] === letter) return "correct";
    if (targetLetters.includes(letter)) return "present"; 
    return "absent";
  };

  const getKeyboardStatus = (key: string) => {
    let status = "default";
    for (let guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          const letterStatus = getLetterStatus(key, i, guess);
          if (letterStatus === "correct") return "correct"; 
          if (letterStatus === "present" && status !== "correct") status = "present";
          if (letterStatus === "absent" && status === "default") status = "absent";
        }
      }
    }
    return status;
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-bold animate-pulse">Bulut Verileri Çekiliyor...</div>;
  }

  return (
    <main className="p-5 animate-in fade-in duration-500 pb-24 min-h-screen flex flex-col relative overflow-hidden">
      
      <div className="flex items-center mb-4 z-10">
        <Link href="/games" onClick={() => playSound("click")} className="bg-card px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
          <span>←</span> Oyunlar
        </Link>
      </div>

      {phase === "settings" && (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-5 max-w-md mx-auto w-full z-10">
          <div className="text-center mb-2">
            <div className="text-6xl mb-2 drop-shadow-lg">📝</div>
            <h2 className="display-font text-4xl text-primary">Wordle</h2>
            <p className="text-text/70 text-sm mt-2">Günün gizli kelimesini 6 denemede bul!</p>
            <p className="text-primary/60 text-xs mt-1 font-bold">Bulutta {allWords.length} kelime seni bekliyor.</p>
          </div>

          <div className="flex flex-col gap-3">
            {/* LİDERLİK TABLOSU (Rekorlar) */}
            <div className="bg-card border border-primary/40 rounded-3xl p-5 shadow-lg flex justify-between items-center bg-gradient-to-br from-background to-primary/5">
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Emircan (Max)</span>
                <span className="text-3xl font-black text-primary">{leaderboard.emircan}</span>
              </div>
              <div className="text-2xl opacity-50">⚔️</div>
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest text-text/50 font-bold">Efsun (Max)</span>
                <span className="text-3xl font-black text-primary">{leaderboard.efsun}</span>
              </div>
            </div>

            {/* YENİ: SON 5 MAÇ GEÇMİŞİ */}
            <div className="bg-card border border-primary/20 rounded-3xl p-4 shadow-md flex justify-between gap-2">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold mb-2">Emircan (Son 5)</span>
                <div className="flex gap-1 flex-wrap justify-center">
                  {recentScores.emircan.length > 0 ? recentScores.emircan.map((s, i) => (
                    <span key={i} className={`text-xs font-bold px-2 py-1 rounded-md border ${s > 0 ? 'bg-green-500/10 text-green-500 border-green-500/30 shadow-[inset_0_0_8px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>{s}</span>
                  )) : <span className="text-xs text-text/30">-</span>}
                </div>
              </div>
              <div className="w-px bg-primary/10"></div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] uppercase tracking-widest text-text/50 font-bold mb-2">Efsun (Son 5)</span>
                <div className="flex gap-1 flex-wrap justify-center">
                  {recentScores.efsun.length > 0 ? recentScores.efsun.map((s, i) => (
                    <span key={i} className={`text-xs font-bold px-2 py-1 rounded-md border ${s > 0 ? 'bg-green-500/10 text-green-500 border-green-500/30 shadow-[inset_0_0_8px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>{s}</span>
                  )) : <span className="text-xs text-text/30">-</span>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            
            {/* HARF SAYISI SEÇİMİ */}
            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block text-center">Kaç Harfli Olsun?</label>
              <div className="flex gap-2">
                {[4, 5, 6, 7].map(len => {
                  const hasWords = allWords.some(w => w.word.length === len);
                  return (
                    <button 
                      key={len}
                      onClick={() => { setWordLength(len); playSound("click"); }}
                      disabled={!hasWords}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-30 ${wordLength === len ? 'bg-primary text-background shadow-md scale-105' : 'bg-background border border-primary/20 text-text/70'}`}
                    >
                      {len}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center bg-primary/5 border border-primary/10 rounded-2xl p-4">
              <p className="text-xs text-text/60 uppercase tracking-widest font-bold">Hoşgeldin</p>
              <h3 className="text-2xl font-black text-primary drop-shadow-sm">{currentUser}</h3>
            </div>
          </div>

          <button 
            onClick={startGame} 
            className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg"
          >
            Oyunu Başlat 🚀
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex-1 flex flex-col items-center justify-between animate-in zoom-in duration-300 w-full max-w-md mx-auto">
          
          <div className="grid grid-rows-6 gap-2 w-full max-w-[340px] mx-auto mt-4">
            {Array.from({ length: 6 }).map((_, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length;
              const guess = guesses[rowIndex] || "";
              const currentGuessText = isCurrentRow ? currentGuess : guess;

              return (
                <div 
                  key={rowIndex} 
                  className="grid gap-1 md:gap-2" 
                  style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: wordLength }).map((_, colIndex) => {
                    const letter = currentGuessText[colIndex] || "";
                    let bgColor = "bg-card border-primary/20 text-primary"; 

                    if (rowIndex < guesses.length) { 
                      const status = getLetterStatus(letter, colIndex, guess);
                      if (status === "correct") bgColor = "bg-green-500 text-white border-green-500 shadow-lg";
                      else if (status === "present") bgColor = "bg-yellow-500 text-white border-yellow-500 shadow-lg";
                      else bgColor = "bg-black/20 text-white/40 border-black/10";
                    } else if (isCurrentRow && letter) { 
                      bgColor = "bg-card border-primary/80 text-primary scale-105";
                    }

                    return (
                      <div 
                        key={colIndex} 
                        className={`w-full aspect-square border-2 rounded-xl flex items-center justify-center text-xl md:text-2xl font-black transition-all duration-300 uppercase ${bgColor}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="w-full mt-8">
            {gameStatus !== "playing" ? (
              <div className="text-center p-4 bg-card border border-primary/20 rounded-2xl animate-in slide-in-from-bottom-2">
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {gameStatus === "won" ? "Tebrikler! 🎉" : "Maalesef! 😔"}
                </h3>
                <p className="text-text/70 mb-2">Gizli kelime: <span className="font-bold text-primary tracking-widest">{targetWord}</span></p>
                <p className="text-xs text-text/50">Sonuç ekranına yönlendiriliyorsun...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full px-1">
                {KEYBOARD_ROWS.map((row, i) => (
                  <div key={i} className="flex justify-center gap-1">
                    {row.map(key => {
                      const status = getKeyboardStatus(key);
                      let keyBg = "bg-card border-primary/20 text-primary";
                      if (status === "correct") keyBg = "bg-green-500 text-white border-green-500";
                      if (status === "present") keyBg = "bg-yellow-500 text-white border-yellow-500";
                      if (status === "absent") keyBg = "bg-black/20 text-white/40 border-transparent opacity-50";

                      return (
                        <button
                          key={key}
                          onClick={() => onKeyPress(key)}
                          className={`${key === "ENTER" || key === "DEL" ? 'px-3 text-[10px] w-14' : 'w-8 md:w-9 text-base md:text-lg'} h-12 flex items-center justify-center font-bold rounded-lg border shadow-sm active:scale-95 transition-all ${keyBg}`}
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in max-w-sm mx-auto w-full">
          <div className="text-7xl mb-4 drop-shadow-lg">{gameStatus === "won" ? "👑" : "💔"}</div>
          <h2 className="display-font text-4xl text-primary mb-2 text-center font-black">
            {gameStatus === "won" ? "Helal Olsun!" : "Bilemedin..."}
          </h2>
          <p className="text-text/70 mb-6 text-center text-sm px-4 font-medium">
            Gizli kelime: <span className="font-bold text-primary">{targetWord}</span> <br/>
            {currentUser}, bu maçtaki skorun:
          </p>

          <div className="bg-card border border-primary/30 w-full p-8 rounded-[32px] shadow-2xl flex flex-col items-center mb-6 relative">
            {gameStatus === "won" && (
               <span className="absolute -top-3 bg-green-500 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-lg">
                 {guesses.length}. Denemede Bildin
               </span>
            )}
            <h3 className="display-font text-7xl text-primary font-black drop-shadow-sm">{score}</h3>
            <span className="text-xs uppercase tracking-widest text-text/50 mt-3 font-bold">Kazanılan Puan</span>
          </div>

          {!isSaved ? (
             <button 
              onClick={saveScoreToDatabase}
              className="w-full bg-primary text-background py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform text-lg mb-6"
            >
              Skorunu Kaydet 💾
            </button>
          ) : (
            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-2xl font-bold text-center mb-6">
              Skor başarıyla kaydedildi! ✅
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => { setPhase("settings"); playSound("click"); }} className="w-full bg-card border border-primary/20 text-primary p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-all font-bold text-lg">
              🔄 Başka Bir Kelime
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