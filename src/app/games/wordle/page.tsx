"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

const INITIAL_WORDS = [
  { word: "KALP" }, { word: "UMUT" }, { word: "GECE" }, { word: "ŞANS" }, { word: "BUSE" },
  { word: "SEVGİ" }, { word: "AŞKIM" }, { word: "HAYAL" }, { word: "TUTKU" }, { word: "HUZUR" },
  { word: "SEVDAM" }, { word: "HASRET" }, { word: "BİRLİK" }, { word: "SONSUZ" }, { word: "CENNET" },
  { word: "SEVGİLİ" }, { word: "GELECEK" }, { word: "BİRİCİK" }, { word: "MANZARA" }, { word: "PAPATYA" }
];

const KEYBOARD_ROWS = [
  ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "DEL"]
];

export default function WordlePage() {
  const [phase, setPhase] = useState<"settings" | "playing" | "finalResult">("settings");
  
  const [allWords, setAllWords] = useState<any[]>([]);
  const [wordLength, setWordLength] = useState<number>(5);
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState({ emircan: 0, efsun: 0 });
  const [selectedPlayer, setSelectedPlayer] = useState<"Emircan" | "Efsun" | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: scoresData } = await supabase.from('game_scores').select('*').eq('game_name', 'wordle');
    if (scoresData) {
      const emircanScores = scoresData.filter(d => d.player_name === 'Emircan').map(d => d.score);
      const efsunScores = scoresData.filter(d => d.player_name === 'Efsun').map(d => d.score);
      setLeaderboard({
        emircan: emircanScores.length ? Math.max(...emircanScores) : 0,
        efsun: efsunScores.length ? Math.max(...efsunScores) : 0,
      });
    }

    const { data: wordsData } = await supabase.from('wordle_words').select('*');
    if (wordsData && wordsData.length > 0) {
      setAllWords(wordsData);
    } else {
      await supabase.from('wordle_words').insert(INITIAL_WORDS);
      setAllWords(INITIAL_WORDS);
    }
    setIsLoading(false);
  };

  const startGame = () => {
    if (!selectedPlayer || allWords.length === 0) return;
    
    const filteredWords = allWords.filter(w => w.word.length === wordLength);
    
    if (filteredWords.length === 0) {
      alert(`Veritabanında ${wordLength} harfli kelime bulunamadı! Supabase'den eklemelisin.`);
      return;
    }

    playSound("start");
    
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
    playSound("wordle_key"); // YENİ SES TETİKLEYİCİSİ

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

  const calculateScore = (attempts: number, won: boolean) => {
    if (!won) {
      setScore(0);
    } else {
      const lengthMultiplier = wordLength - 3; 
      const points = [100, 80, 60, 40, 20, 10];
      const baseScore = points[attempts - 1] || 10;
      setScore(baseScore * lengthMultiplier);
    }
  };

  const saveScoreToDatabase = async () => {
    if (!selectedPlayer || isSaved) return;
    playSound("success");
    await supabase.from('game_scores').insert([{
      game_name: 'wordle',
      player_name: selectedPlayer,
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
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-bold animate-pulse">Kelimeler Yükleniyor...</div>;
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
            <p className="text-primary/60 text-xs mt-1 font-bold">Bulutta {allWords.length} kelime seni bekliiyor.</p>
          </div>

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
          
          <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            
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

            <div>
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-3 block text-center">Oyuna Kim Başlıyor?</label>
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
            disabled={!selectedPlayer}
            className="w-full mt-2 bg-primary text-background p-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold text-lg disabled:opacity-50"
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
            {selectedPlayer}, bu maçtaki skorun:
          </p>

          <div className="bg-card border border-primary/30 w-full p-8 rounded-[32px] shadow-2xl flex flex-col items-center mb-6">
            <h3 className="display-font text-7xl text-primary font-black drop-shadow-sm">{score}</h3>
            <span className="text-xs uppercase tracking-widest text-text/50 mt-3 font-bold">Kazanılan Puan</span>
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