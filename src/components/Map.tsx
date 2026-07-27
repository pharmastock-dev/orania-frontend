import { useEffect, useRef, useState } from 'react'

let leafletPromise: Promise<any> | null = null
function loadLeaflet(): Promise<any> {
  if ((window as any).L) return Promise.resolve((window as any).L)
  if (leafletPromise) return leafletPromise
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
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

const ORAN: [number, number] = [35.6969, -0.6331]

export function MapPicker({ value, onChange, height = 300 }: {
  value?: { lat: number; lng: number } | null
  onChange: (pos: { lat: number; lng: number }) => void
  height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const watchRef = useRef<number | null>(null)
  const bestAccuracyRef = useRef<number>(Infinity)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [msg, setMsg] = useState<string>('')
  const [adresse, setAdresse] = useState<string>('')

  // reverse geocoding : afficher l'adresse en toutes lettres
  const chercherAdresse = async (lat: number, lng: number) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'fr' },
      })
      const d = await r.json()
      if (d && d.display_name) setAdresse(d.display_name)
    } catch {}
  }

  const placer = (lat: number, lng: number, accuracy?: number) => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([lat, lng])
    if (circleRef.current) {
      if (accuracy && accuracy < 200) {
        circleRef.current.setLatLng([lat, lng]).setRadius(accuracy)
        mapRef.current.addLayer(circleRef.current)
      } else {
        mapRef.current.removeLayer(circleRef.current)
      }
    }
    onChange({ lat, lng })
  }

  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current) return
      const start: [number, number] = value ? [value.lat, value.lng] : ORAN
      const map = L.map(ref.current).setView(start, value ? 17 : 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)
      const marker = L.marker(start, { draggable: true }).addTo(map)
      const circle = L.circle(start, { radius: 0, color: '#FF6B00', fillColor: '#FF6B00', fillOpacity: 0.12, weight: 1 })
      marker.on('dragend', () => {
        const p = marker.getLatLng()
        placer(p.lat, p.lng); setMsg(''); chercherAdresse(p.lat, p.lng)
      })
      map.on('click', (e: any) => {
        placer(e.latlng.lat, e.latlng.lng); setMsg(''); chercherAdresse(e.latlng.lat, e.latlng.lng)
      })
      mapRef.current = map; markerRef.current = marker; circleRef.current = circle
      setLoading(false)
      setTimeout(() => map.invalidateSize(), 200)
      if (value) chercherAdresse(value.lat, value.lng)
    })
    return () => {
      cancelled = true
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  // localisation haute précision : on suit plusieurs mesures et on garde la meilleure
  const localiser = () => {
    if (!navigator.geolocation) { setMsg("La géolocalisation n'est pas disponible."); return }
    setLocating(true); setMsg('Localisation en cours… (ne bougez pas)')
    bestAccuracyRef.current = Infinity

    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy
        // ne garder que si c'est plus précis que la meilleure mesure
        if (acc < bestAccuracyRef.current) {
          bestAccuracyRef.current = acc
          const lat = pos.coords.latitude, lng = pos.coords.longitude
          mapRef.current.setView([lat, lng], acc < 50 ? 18 : 16)
          placer(lat, lng, acc)
          setMsg(`📡 Précision : ~${Math.round(acc)} m ${acc <= 30 ? '(excellente ✓)' : '(en amélioration…)'}`)
          chercherAdresse(lat, lng)
        }
        // arrêter dès qu'on atteint une bonne précision
        if (acc <= 20) {
          if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null }
          setLocating(false)
          setMsg(`✓ Position précise trouvée (~${Math.round(acc)} m). Ajustez si besoin.`)
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) setMsg("Autorisez la localisation, activez le GPS, puis réessayez.")
        else if (err.code === 3) setMsg("Délai dépassé. Réessayez près d'une fenêtre ou dehors.")
        else setMsg("Impossible d'obtenir la position. Placez le marqueur manuellement.")
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )

    // sécurité : arrêter le suivi après 20s
    setTimeout(() => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null
        setLocating(false)
        if (bestAccuracyRef.current !== Infinity)
          setMsg(`Position obtenue (~${Math.round(bestAccuracyRef.current)} m). Ajustez le marqueur pour plus de précision.`)
      }
    }, 21000)
  }

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-stone-200" style={{ height }}>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-stone-50 text-stone-400 text-sm">Chargement de la carte…</div>}
        <button type="button" onClick={localiser} disabled={locating}
          className="absolute bottom-3 right-3 z-[500] bg-amber-500 text-white shadow-lg rounded-xl px-3 py-2 text-xs font-bold hover:bg-amber-600 disabled:opacity-60">
          {locating ? '⏳ Localisation…' : '📍 Ma position'}
        </button>
      </div>
      {msg && <p className="text-[11px] text-stone-600 mt-1.5 font-medium">{msg}</p>}
      {adresse && <p className="text-[11px] text-stone-500 mt-1">📌 {adresse}</p>}
      <p className="text-[11px] text-stone-400 mt-1">💡 Pour plus de précision : activez le GPS, sortez dehors, puis zoomez et ajustez le marqueur exactement.</p>
    </div>
  )
}

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
