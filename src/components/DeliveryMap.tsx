import { useCallback, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import type { Coordonnees } from "../types";
import { getPositionActuelle } from "../utils/geo";

// Icône personnalisée en SVG inline — évite les soucis de chemin d'assets Leaflet + Vite
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 25 17 25s17-12.3 17-25C34 7.6 26.4 0 17 0Z" fill="#f5790c"/>
    <circle cx="17" cy="17" r="6.5" fill="white"/>
  </svg>`,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
});

const ORAN_CENTER: Coordonnees = { latitude: 35.6969, longitude: -0.6331 };

function ClicSurCarte({ onPick }: { onPick: (pos: Coordonnees) => void }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function RecentreCarte({ position }: { position: Coordonnees }) {
  const map = useMap();
  map.setView([position.latitude, position.longitude], map.getZoom());
  return null;
}

interface DeliveryMapProps {
  position: Coordonnees | null;
  onChange: (pos: Coordonnees) => void;
}

export default function DeliveryMap({ position, onChange }: DeliveryMapProps) {
  const [locLoading, setLocLoading] = useState(false);
  const centre = position || ORAN_CENTER;

  const handleMaPosition = useCallback(async () => {
    setLocLoading(true);
    try {
      const pos = await getPositionActuelle();
      onChange(pos);
    } catch {
      // silencieux — le marqueur reste déplaçable manuellement
    } finally {
      setLocLoading(false);
    }
  }, [onChange]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[var(--color-ink-100)]" style={{ height: 260 }}>
      <MapContainer center={[centre.latitude, centre.longitude]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClicSurCarte onPick={onChange} />
        {position && (
          <>
            <Marker
              position={[position.latitude, position.longitude]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const p = m.getLatLng();
                  onChange({ latitude: p.lat, longitude: p.lng });
                },
              }}
            />
            <RecentreCarte position={position} />
          </>
        )}
      </MapContainer>

      <button
        onClick={handleMaPosition}
        className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 bg-[var(--color-orange-500)] text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg"
      >
        <LocateFixed size={13} className={locLoading ? "animate-spin" : ""} />
        Ma position
      </button>
    </div>
  );
}
