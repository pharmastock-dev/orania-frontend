import { useEffect, useRef, useState } from 'react'

// Charge Leaflet depuis le CDN une seule fois
let leafletPromise: Promise<any> | null = null
function loadLeaflet(): Promise<any> {
  if ((window as any).L) return Promise.resolve((window as any).L)
  if (leafletPromise) return leafletPromise
  leafletPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    // JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve((window as any).L)
    script.onerror = reject
    document.head.appendChild(script)
  })
  return leafletPromise
}

// Coordonnées par défaut : centre d'Oran
const ORAN: [number, number] = [35.6969, -0.6331]

// ─── Carte pour CHOISIR une position (client) ───────────────────────────────
export function MapPicker({ value, onChange, height = 260 }: {
  value?: { lat: number; lng: number } | null
  onChange: (pos: { lat: number; lng: number }) => void
  height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current) return
      const start: [number, number] = value ? [value.lat, value.lng] : ORAN
      const map = L.map(ref.current).setView(start, 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)
      const marker = L.marker(start, { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const p = marker.getLatLng()
        onChange({ lat: p.lat, lng: p.lng })
      })
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
      })
      mapRef.current = map
      markerRef.current = marker
      setLoading(false)
      setTimeout(() => map.invalidateSize(), 200)
    })
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  const localiser = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const p: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      if (mapRef.current && markerRef.current) {
        mapRef.current.setView(p, 16)
        markerRef.current.setLatLng(p)
        onChange({ lat: p[0], lng: p[1] })
      }
    })
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-stone-200" style={{ height }}>
      <div ref={ref} style={{ height: '100%', width: '100%' }} />
      {loading && <div className="absolute inset-0 flex items-center justify-center bg-stone-50 text-stone-400 text-sm">Chargement de la carte…</div>}
      <button type="button" onClick={localiser}
        className="absolute bottom-3 right-3 z-[500] bg-white shadow-lg rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 border border-stone-200">
        📍 Ma position
      </button>
    </div>
  )
}

// ─── Carte pour AFFICHER une position (lecture seule) ────────────────────────
export function MapView({ lat, lng, height = 200 }: { lat: number; lng: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current) return
      const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)
      L.marker([lat, lng]).addTo(map)
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 200)
    })
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [lat, lng])

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200" style={{ height }}>
      <div ref={ref} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
