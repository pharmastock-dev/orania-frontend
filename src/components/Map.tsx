import { useEffect, useRef, useState } from 'react'

// Charge Leaflet depuis le CDN une seule fois
let leafletPromise: Promise<any> | null = null
function loadLeaflet(): Promise<any> {
  if ((window as any).L) return Promise.resolve((window as any).L)
  if (leafletPromise) return leafletPromise
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve((window as any).L)
    script.onerror = reject
    document.head.appendChild(script)
  })
  return leafletPromise
}

// Centre d'Oran par défaut
const ORAN: [number, number] = [35.6969, -0.6331]

// ─── Carte pour CHOISIR une position ─────────────────────────────────────────
export function MapPicker({ value, onChange, height = 280 }: {
  value?: { lat: number; lng: number } | null
  onChange: (pos: { lat: number; lng: number }) => void
  height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [msg, setMsg] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current) return
      const start: [number, number] = value ? [value.lat, value.lng] : ORAN
      const map = L.map(ref.current).setView(start, value ? 16 : 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)
      const marker = L.marker(start, { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const p = marker.getLatLng()
        onChange({ lat: p.lat, lng: p.lng })
        setMsg('')
      })
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
        setMsg('')
      })
      mapRef.current = map
      markerRef.current = marker
      setLoading(false)
      setTimeout(() => map.invalidateSize(), 200)
    })
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  const localiser = () => {
    if (!navigator.geolocation) { setMsg("La géolocalisation n'est pas disponible."); return }
    setLocating(true); setMsg('Localisation en cours…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        const precision = Math.round(pos.coords.accuracy)
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView(p, 17)
          markerRef.current.setLatLng(p)
          onChange({ lat: p[0], lng: p[1] })
        }
        setLocating(false)
        setMsg(`✓ Position trouvée (précision ~${precision} m). Ajustez le marqueur si besoin.`)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) setMsg("Autorisez la localisation dans votre navigateur, puis réessayez.")
        else if (err.code === 3) setMsg("Délai dépassé. Réessayez ou placez le marqueur manuellement.")
        else setMsg("Impossible d'obtenir la position. Placez le marqueur manuellement.")
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }  // haute précision
    )
  }

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-stone-200" style={{ height }}>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-stone-50 text-stone-400 text-sm">Chargement de la carte…</div>}
        <button type="button" onClick={localiser} disabled={locating}
          className="absolute bottom-3 right-3 z-[500] bg-white shadow-lg rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 border border-stone-200 disabled:opacity-60">
          {locating ? '⏳ …' : '📍 Ma position'}
        </button>
      </div>
      {msg && <p className="text-[11px] text-stone-500 mt-1.5">{msg}</p>}
      <p className="text-[11px] text-stone-400 mt-1">💡 Astuce : zoomez et cliquez précisément sur l'emplacement exact.</p>
    </div>
  )
}

// ─── Carte pour AFFICHER une position ────────────────────────────────────────
export function MapView({ lat, lng, height = 200 }: { lat: number; lng: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current) return
      const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 16)
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
