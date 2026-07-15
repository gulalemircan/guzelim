"use client";
import { useState, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

const PIN_ICONS = ["📍", "🗼", "🌊", "🌅", "🏖️", "🍢", "🌌", "🏛️", "🍣", "⛰️", "🚲", "🥥", "🍹", "✈️", "🤍", "🏕️"];

interface Pin {
  id: string;
  name: string;
  note: string;
  icon: string;
  lat: number; 
  lng: number; 
}

const INITIAL_PINS: Pin[] = [
  { id: "p1", name: "Paris, Fransa", note: "Aşk şehrinde Eyfel'e karşı romantik bir akşam yemeği.", lat: 48.8566, lng: 2.3522, icon: "🗼" },
  { id: "p2", name: "Roma, İtalya", note: "Tarihi sokaklarda el ele gezip, makarna şarabı yapmak.", lat: 41.9028, lng: 12.4964, icon: "🏛️" },
  { id: "p3", name: "Oslo, Norveç", note: "Kuzey ışıkları altında sonsuz huzur.", lat: 59.9139, lng: 10.7522, icon: "🌌" },
  { id: "p4", name: "Amsterdam, Hollanda", note: "Kanalların etrafında bisiklet turu ve kahve keyfi.", lat: 52.3676, lng: 4.9041, icon: "🚲" },
  { id: "p5", name: "İzmir, Türkiye", note: "Kordon'da yürüyüş, deniz havası ve boyoz.", lat: 38.4237, lng: 27.1428, icon: "🌅" },
  { id: "p6", name: "Muğla, Türkiye", note: "Gizli koylarda baş başa kamp, doğa ve deniz.", lat: 37.2153, lng: 28.3636, icon: "🌊" },
  { id: "p7", name: "Antalya, Türkiye", note: "Sıcak kumsallar, şelaleler ve lüks bir tatil.", lat: 36.8969, lng: 30.7133, icon: "🏖️" },
  { id: "p8", name: "Adana, Türkiye", note: "Birlikte lezzet turu ve sıcacık anılar.", lat: 37.0000, lng: 35.3213, icon: "🍢" },
  { id: "p9", name: "Maldivler", note: "Okyanusun ortasında, su üstü bungalovunda baş başa.", lat: 3.2028, lng: 73.2207, icon: "🍹" },
  { id: "p10", name: "Filipinler", note: "Egzotik adalarda, bembeyaz kumsallarda dinlenmek.", lat: 12.8797, lng: 121.7740, icon: "🥥" },
  { id: "p11", name: "Tokyo, Japonya", note: "Neon ışıklar, sakura çiçekleri ve anime kültürü.", lat: 35.6762, lng: 139.6503, icon: "🍣" },
  { id: "p12", name: "Wellington, Y. Zelanda", note: "Dünyanın öbür ucunda doğa harikalarını keşfetmek.", lat: -41.2865, lng: 174.7762, icon: "⛰️" }
];

export default function MemoriesPage() {
  const [isClient, setIsClient] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  
  const [newLat, setNewLat] = useState(0);
  const [newLng, setNewLng] = useState(0);
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newIcon, setNewIcon] = useState(PIN_ICONS[0]);

  useEffect(() => {
    setIsClient(true);
    fetchPins();
  }, []);

  const fetchPins = async () => {
    const { data } = await supabase.from('map_pins').select('*');
    if (data && data.length > 0) {
      setPins(data);
    } else {
      setPins(INITIAL_PINS);
      await supabase.from('map_pins').insert(INITIAL_PINS);
    }
  };

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    playSound("map_pin"); // YENİ SES TETİKLEYİCİSİ
    setNewLat(latLng[0]);
    setNewLng(latLng[1]);
    setNewName("");
    setNewNote("");
    setNewIcon(PIN_ICONS[0]);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const savePin = async () => {
    if (!newName.trim()) return;
    playSound("success");
    
    if (modalMode === "add") {
      const newPin = {
        id: Date.now().toString(),
        name: newName,
        note: newNote,
        icon: newIcon,
        lat: newLat,
        lng: newLng
      };
      await supabase.from('map_pins').insert([newPin]);
    } else if (modalMode === "edit" && selectedPin) {
      await supabase.from('map_pins').update({
        name: newName,
        note: newNote,
        icon: newIcon
      }).eq('id', selectedPin.id);
    }
    
    setIsModalOpen(false);
    fetchPins(); 
  };

  const openEditModal = (pin: Pin) => {
    playSound("click");
    setSelectedPin(pin);
    setNewName(pin.name);
    setNewNote(pin.note);
    setNewIcon(pin.icon);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const deletePin = async (id: string) => {
    if (confirm("Bu rotayı tamamen silmek istediğine emin misin?")) {
      playSound("click");
      await supabase.from('map_pins').delete().eq('id', id);
      setIsModalOpen(false);
      fetchPins(); 
    }
  };

  if (!isClient) return <div className="min-h-screen bg-background"></div>;

  return (
    <main className="relative min-h-screen bg-background flex flex-col items-center pt-5 pb-24 overflow-hidden">
      <div className="w-full max-w-6xl px-5 z-10 pt-10">
        
        <div className="text-center mb-8">
          <h2 className="display-font text-4xl text-primary drop-shadow-md">Gelecek Rotalarımız</h2>
          <p className="text-text/70 text-sm mt-2 font-medium">Haritada yakınlaş, dilediğin yere tıkla ve rotanı ekle.</p>
        </div>

        <div className="w-full rounded-[32px] border-2 border-primary/20 shadow-2xl mb-10 overflow-hidden bg-card relative" style={{ height: '500px' }}>
          <div className="w-full h-full" style={{ filter: 'contrast(0.9) sepia(0.3) hue-rotate(-10deg)' }}>
            <Map 
              defaultCenter={[38.9637, 35.2433]} 
              defaultZoom={4} 
              onClick={handleMapClick}
            >
              {pins.map((pin) => (
                <Marker key={pin.id} width={60} anchor={[pin.lat, pin.lng]}>
                  <div 
                    className="relative flex flex-col items-center group cursor-pointer hover:scale-125 transition-transform"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      openEditModal(pin);
                    }}
                  >
                    <div className="absolute -top-6 bg-background border border-primary/40 px-2 py-1 rounded-md text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none">
                      {pin.name}
                    </div>
                    
                    <div className="text-4xl drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-bounce" style={{ animationDuration: '2s' }}>
                      {pin.icon}
                    </div>
                  </div>
                </Marker>
              ))}
            </Map>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span>🎫</span> Seyahat Biletlerimiz ({pins.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...pins].reverse().map((pin) => (
              <div 
                key={pin.id}
                onClick={() => openEditModal(pin)}
                className="bg-card border border-primary/20 rounded-2xl p-4 flex gap-4 items-center hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer shadow-md group relative overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full border-r border-primary/20"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full border-l border-primary/20"></div>

                <div className="text-4xl pl-4 group-hover:scale-110 transition-transform">{pin.icon}</div>
                <div className="flex-1 pr-2">
                  <h4 className="font-bold text-primary leading-tight">{pin.name}</h4>
                  <p className="text-xs text-text/60 mt-1 line-clamp-2">{pin.note || "Bir gün mutlaka..."}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-primary/20 relative">
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 text-text/50 hover:text-primary text-xl"
            >
              ✖
            </button>

            <h3 className="display-font text-2xl text-primary mb-6">
              {modalMode === "edit" ? "Rotayı Düzenle ✏️" : "Yeni Rota Çak 📍"}
            </h3>
            
            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Raptiye İkonu</label>
              <div className="flex flex-wrap gap-2">
                {PIN_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => { playSound("click"); setNewIcon(icon); }}
                    className={`text-2xl p-2 rounded-xl transition-all ${newIcon === icon ? 'bg-primary/20 border border-primary shadow-inner scale-110' : 'hover:bg-primary/10 border border-transparent'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Şehir / Ülke Adı</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: Kapadokya"
                className="w-full bg-background border border-primary/30 rounded-xl p-4 text-sm font-bold text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Hayalimiz / Notumuz</label>
              <textarea 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Balonlara binip güneşi doğuracağız..."
                className="w-full bg-background border border-primary/30 rounded-xl p-4 text-sm font-bold text-primary focus:outline-none focus:border-primary transition-colors resize-none h-24"
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={savePin}
                disabled={!newName.trim()}
                className="flex-1 bg-primary text-background p-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                Kaydet
              </button>
              {modalMode === "edit" && (
                <button 
                  onClick={() => deletePin(selectedPin!.id)}
                  className="bg-red-500/10 text-red-500 border border-red-500/30 p-4 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
                >
                  Sil 🗑️
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </main>
  );
}