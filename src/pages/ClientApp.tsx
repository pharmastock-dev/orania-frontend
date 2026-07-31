import { useState, useEffect } from 'react'
import { clientApi, reclamationApi, type Acheteur, type Fournisseur, type Produit, type Avis } from '../lib/api'
import { StarRating, getCat, imgUrl, fmtDA, Spinner, magasinOuvert, hhmm, tempsLivraison } from '../lib/shared'
import { catEmoji } from '../lib/categories'
import { LogoOrania } from '../components/Logo'
import { MapPicker, MapView } from '../components/Map'
import { ArrowLeft, Search, MapPin, Clock, Bike, Flame, User, Phone, Map as MapIcon, Navigation, ChevronDown, Store, Utensils, ReceiptText, History, Star, LogOut } from 'lucide-react'

interface CartItem { produit: Produit; quantite: number }
type CPage = 'login' | 'stores' | 'menu'

export function ClientApp({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState<CPage>('login')
  const [acheteur, setAcheteur] = useState<Acheteur | null>(null)
  const [store, setStore] = useState<Fournisseur | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('acheteur')
    if (saved) {
      try {
        setAcheteur(JSON.parse(saved))
        const savedStore = localStorage.getItem('client_store')
        const savedPage = localStorage.getItem('client_page') as CPage | null
        if (savedPage === 'menu' && savedStore) {
          setStore(JSON.parse(savedStore)); setPage('menu')
        } else {
          setPage('stores')
        }
      } catch { localStorage.removeItem('acheteur') }
    }
  }, [])

  const goStores = () => {
    localStorage.setItem('client_page', 'stores'); localStorage.removeItem('client_store')
    if (((window as any).__oraniaBackDepth || 0) > 0) { window.history.back(); return }
    setStore(null); setPage('stores')
  }

  const goMenu = (s: Fournisseur) => {
    localStorage.setItem('client_page', 'menu'); localStorage.setItem('client_store', JSON.stringify(s))
    ;(window as any).__oraniaBackDepth = ((window as any).__oraniaBackDepth || 0) + 1
    window.history.pushState({ clientPage: 'menu' }, '')
    setStore(s); setPage('menu')
  }

  useEffect(() => {
    const onPop = () => {
      setPage((cur) => {
        if (cur === 'menu') {
          setStore(null)
          localStorage.setItem('client_page', 'stores'); localStorage.removeItem('client_store')
          return 'stores'
        }
        return cur
      })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const login = (a: Acheteur) => {
    setAcheteur(a); localStorage.setItem('client_page', 'stores'); setPage('stores')
  }

  const retourAccueil = () => { onExit() }

  const logout = () => {
    localStorage.removeItem('acheteur'); localStorage.removeItem('client_page'); localStorage.removeItem('client_store')
    setAcheteur(null); setStore(null); onExit()
  }

  if (page === 'login' || !acheteur) return <LoginPage onLogin={login} onExit={onExit} />
  if (page === 'menu' && store) return <MenuPage acheteur={acheteur} store={store} onBack={goStores} />
  return <StoresPage acheteur={acheteur} onSelect={goMenu} onRetour={retourAccueil} onLogout={logout} />
}

// ─── Modal Compte ─────────────────────────────────────────────────────────────
function CompteModal({ acheteur, onClose, onLogout }: { acheteur: Acheteur; onClose: () => void; onLogout: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-stone-800 text-lg">Mon Compte</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold p-1">✕</button>
        </div>
        <div className="space-y-3 mb-6">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
            <User className="text-amber-500" size={20} />
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Nom</p>
              <p className="text-sm font-bold text-stone-800">{acheteur.nom}</p>
            </div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
            <Phone className="text-amber-500" size={20} />
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Téléphone</p>
              <p className="text-sm font-bold text-stone-800">{acheteur.telephone}</p>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onExit }: { onLogin: (a: Acheteur) => void; onExit: () => void }) {
  const [nom, setNom] = useState(''); const [tel, setTel] = useState('')
  const [loading, setLoading] = useState(false); const [error, setError] = useState('')

  const submit = async () => {
    if (!nom.trim() || !tel.trim()) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true); setError('')
    try {
      const data = await clientApi.login(nom.trim(), tel.trim())
      localStorage.setItem('acheteur', JSON.stringify(data)); onLogin(data)
    } catch { setError('Impossible de se connecter. Réessayez.') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white px-5 py-10">
      <div className="mb-10 text-center">
        <div className="w-28 h-28 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-black/10"><LogoOrania size={80} /></div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Orania</h1>
        <p className="text-stone-400 text-sm mt-1.5">Tout Oran, en un clic</p>
      </div>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-stone-200/60 p-8">
        <h2 className="text-xl font-bold text-stone-800 mb-1">Bienvenue 👋</h2>
        <p className="text-stone-400 text-sm mb-7">Entrez votre nom et téléphone — aucun mot de passe requis.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Votre nom complet</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value.replace(/[^a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ '\\-]/g, ''))} placeholder="Ex : Amira Bouali"
              className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Numéro de téléphone</label>
            <input type="tel" inputMode="numeric" value={tel} onChange={(e) => setTel(e.target.value.replace(/[^0-9]/g, ''))} placeholder="05 XX XX XX XX" onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all" />
          </div>
          {error && <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3">{error}</div>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-200/80 disabled:opacity-60 text-base mt-2">
            {loading ? 'Connexion…' : 'Continuer →'}
          </button>
        </div>
        <div className="mt-7 pt-5 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400">💵 Paiement uniquement en <strong>espèces</strong></p>
          <button onClick={onExit} className="text-xs text-stone-300 hover:text-stone-500 mt-2 transition-colors inline-flex items-center gap-1"><ArrowLeft size={13} /> Changer d'espace</button>
        </div>
      </div>
    </div>
  )
}

// ─── Store card ───────────────────────────────────────────────────────────────
function StoreCard({ store, distance, onClick }: { store: Fournisseur; distance?: number | null; onClick: () => void }) {
  const colors = getCat(store.categorie); const open = magasinOuvert(store.heure_ouverture, store.heure_fermeture); const photo = imgUrl(store.photo)
  return (
    <button onClick={onClick} className="group w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:border-amber-200 active:scale-[0.98] transition-all text-left">
      <div className="relative h-36 bg-amber-50 overflow-hidden">
        {photo ? <img src={photo} alt={store.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Store size={48} className="opacity-25" /></div>}
        {open !== null && <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${open ? 'bg-emerald-500 text-white' : 'bg-stone-400/80 text-white'}`}>{open ? '● Ouvert' : '● Fermé'}</span>}
        {store.a_promo && <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-pink-500 text-white flex items-center gap-1"><Flame size={10} /> Promo</span>}
        <span className={`absolute bottom-2.5 left-2.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>{store.categorie}</span>
      </div>
      <div className="px-4 py-3">
        <h3 className="font-bold text-stone-800 text-sm leading-tight mb-1.5">{store.nom}</h3>
        <div className="flex items-center gap-1.5">
          <StarRating note={Math.round(store.note_moyenne ?? 0)} />
          <span className="text-xs text-stone-400">{store.note_moyenne ? store.note_moyenne.toFixed(1) : '—'}{store.nb_avis ? ` · ${store.nb_avis} avis` : ''}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {store.heure_ouverture && <p className="text-[11px] text-stone-400"><Clock size={11} className="inline mr-0.5" />{hhmm(store.heure_ouverture)}–{hhmm(store.heure_fermeture)}</p>}
          {distance != null && <p className="text-[11px] text-amber-600 font-semibold"><MapPin size={11} className="inline mr-0.5" />{distance < 1 ? Math.round(distance * 1000) + ' m' : distance.toFixed(1) + ' km'}</p>}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {distance != null && tempsLivraison(distance) && (
            <span className="text-[11px] text-stone-600 font-medium bg-stone-100 px-2 py-0.5 rounded-full"><Bike size={11} className="inline mr-0.5" />{tempsLivraison(distance)}</span>
          )}
          {store.livraison_gratuite
            ? <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Livraison gratuite</span>
            : (store.frais_min != null && <span className="text-[11px] text-stone-600 font-medium bg-stone-100 px-2 py-0.5 rounded-full">Livraison {store.frais_min}{store.frais_max && store.frais_max !== store.frais_min ? `–${store.frais_max}` : ''} DA</span>)
          }
        </div>
      </div>
    </button>
  )
}

// ─── Stores page ──────────────────────────────────────────────────────────────
type TriMode = 'distance' | 'etoiles'

function distanceKm(la1?: number | null, lo1?: number | null, la2?: number | null, lo2?: number | null): number | null {
  if (la1 == null || lo1 == null || la2 == null || lo2 == null) return null
  const R = 6371, toR = (d: number) => (d * Math.PI) / 180
  const dLa = toR(la2 - la1), dLo = toR(lo2 - lo1)
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(toR(la1)) * Math.cos(toR(la2)) * Math.sin(dLo / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function StoresPage({ acheteur, onSelect, onRetour, onLogout }: { acheteur: Acheteur; onSelect: (s: Fournisseur) => void; onRetour: () => void; onLogout: () => void }) {
  const [showCompte, setShowCompte] = useState(false)
  const [stores, setStores] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false)
  const [search, setSearch] = useState(''); const [cat, setCat] = useState('Tous')
  const [tri, setTri] = useState<TriMode>('distance')
  const [filtreOuvert, setFiltreOuvert] = useState<'tous' | 'ouvert' | 'ferme'>('tous')
  const [filtreGratuit, setFiltreGratuit] = useState(false)
  const [filtrePromo, setFiltrePromo] = useState(false)
  const [showFiltre, setShowFiltre] = useState(false)
  const [maPos, setMaPos] = useState<{ lat: number; lng: number } | null>(null)
  const [posErr, setPosErr] = useState(false)

  useEffect(() => {
    clientApi.fournisseurs().then((d) => { setStores(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => { setError(true); setLoading(false) })
  }, [])

  useEffect(() => {
    if (tri === 'distance' && !maPos && !posErr && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMaPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setPosErr(true),
        { timeout: 8000 },
      )
    }
  }, [tri, maPos, posErr])

  const categories = ['Tous', ...Array.from(new Set(stores.map((s) => s.categorie)))]

  const q = search.trim().toLowerCase()
  let filtered = stores.filter((s) => {
    const mc = cat === 'Tous' || s.categorie === cat
    if (!mc) return false
    if (!q) return true
    if (s.nom.toLowerCase().includes(q)) return true
    if (s.categorie.toLowerCase().includes(q)) return true
    if ((s.produits_noms || []).some((n) => n.toLowerCase().includes(q))) return true
    if ((s.produits_categories || []).some((c) => c.toLowerCase().includes(q))) return true
    return false
  })

  if (filtreOuvert !== 'tous') {
    filtered = filtered.filter((s) => {
      const o = magasinOuvert(s.heure_ouverture, s.heure_fermeture)
      if (filtreOuvert === 'ouvert') return o === true
      if (filtreOuvert === 'ferme') return o === false
      return true
    })
  }
  if (filtreGratuit) filtered = filtered.filter((s) => s.livraison_gratuite === true)
  if (filtrePromo) filtered = filtered.filter((s) => s.a_promo === true)

  filtered = [...filtered].sort((a, b) => {
    if (tri === 'etoiles') return (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0)
    const da = distanceKm(maPos?.lat, maPos?.lng, a.latitude, a.longitude)
    const db = distanceKm(maPos?.lat, maPos?.lng, b.latitude, b.longitude)
    if (da == null && db == null) return 0
    if (da == null) return 1
    if (db == null) return -1
    return da - db
  })

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20 shadow-sm shadow-stone-50">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={onRetour} title="Retour à l'accueil"
            className="shrink-0 w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700"><ArrowLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><LogoOrania size={26} /><h1 className="font-extrabold text-stone-900 text-lg truncate">Orania</h1></div>
            <p className="text-xs text-stone-400 ml-8 truncate">Bonjour, {acheteur.nom} 👋</p>
          </div>
          <button onClick={() => setShowCompte(true)} className="shrink-0 text-xs text-stone-500 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-amber-50 inline-flex items-center gap-1"><User size={14} />Compte</button>
        </div>
        {showCompte && <CompteModal acheteur={acheteur} onClose={() => setShowCompte(false)} onLogout={onLogout} />}

        <div className="px-4 pb-3 pt-1 max-w-lg mx-auto flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none"><Search size={16} /></span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher : pizza, thé, sushi…"
              className="w-full pl-10 pr-4 py-3 bg-stone-100 border border-transparent rounded-2xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">✕</button>}
          </div>
          <button onClick={() => setShowFiltre((v) => !v)}
            className={`px-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${showFiltre ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            ⚙️ {tri === 'distance' ? 'Proche' : 'Top'}
          </button>
        </div>

        {showFiltre && (
          <div className="px-4 pb-3 max-w-lg mx-auto">
            <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3 flex gap-2">
              <button onClick={() => setTri('distance')} className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${tri === 'distance' ? 'bg-amber-500 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>📍 Plus proches</button>
              <button onClick={() => setTri('etoiles')} className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${tri === 'etoiles' ? 'bg-amber-500 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>⭐ Mieux notés</button>
            </div>
            {tri === 'distance' && posErr && <p className="text-[11px] text-amber-600 mt-2">📍 Localisation refusée — tri par distance indisponible.</p>}
          </div>
        )}

        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide max-w-lg mx-auto">
          {categories.map((c) => {
            const colors = c === 'Tous' ? null : getCat(c); const active = cat === c
            return (
              <button key={c} onClick={() => setCat(c)}
                className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  active ? (c === 'Tous' ? 'bg-amber-500 text-white shadow-sm shadow-amber-200' : `${colors!.pill} text-white shadow-sm`) : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}>{c}</button>
            )
          })}
        </div>

        <div className="px-4 pb-3 flex gap-2 max-w-lg mx-auto">
          {([['tous', 'Tous'], ['ouvert', '● Ouvert'], ['ferme', '● Fermé']] as [string, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setFiltreOuvert(k as any)}
              className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                filtreOuvert === k
                  ? (k === 'ouvert' ? 'bg-emerald-500 text-white' : k === 'ferme' ? 'bg-stone-500 text-white' : 'bg-stone-800 text-white')
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}>{label}</button>
          ))}
          <button onClick={() => setFiltreGratuit((v) => !v)}
            className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${filtreGratuit ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
            <span className="inline-flex items-center gap-1"><Bike size={13} />Livraison gratuite</span>
          </button>
          <button onClick={() => setFiltrePromo((v) => !v)}
            className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${filtrePromo ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
            <span className="inline-flex items-center gap-1"><Flame size={13} />En promo</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading && <Spinner label="Chargement des commerces…" />}
        {error && !loading && (
          <div className="text-center py-20"><p className="text-5xl mb-4">⚡</p><p className="text-stone-600 font-semibold mb-1">API inaccessible</p><p className="text-stone-400 text-sm">Vérifiez que le serveur tourne</p></div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20"><p className="text-5xl mb-4">🔍</p><p className="text-stone-600 font-semibold mb-1">Aucun résultat</p><p className="text-stone-400 text-sm">Essayez un autre mot-clé</p></div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-xs text-stone-400 mb-3">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}{q ? ` pour « ${search} »` : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{filtered.map((s) => {
              const dist = distanceKm(maPos?.lat, maPos?.lng, s.latitude, s.longitude)
              return <StoreCard key={s.id} store={s} distance={dist} onClick={() => onSelect(s)} />
            })}</div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Menu page ────────────────────────────────────────────────────────────────
function MenuPage({ acheteur, store, onBack }: { acheteur: Acheteur; store: Fournisseur; onBack: () => void }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [avis, setAvis] = useState<Avis[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('orania_cart')
      if (raw) { const parsed = JSON.parse(raw); if (parsed.storeId === store.id) return parsed.items || [] }
    } catch {}
    return []
  })
  const [showSheet, setShowSheet] = useState(false)
  const [livraison, setLivraison] = useState(true)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [ordering, setOrdering] = useState(false)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [myNote, setMyNote] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [avisDone, setAvisDone] = useState(false)
  const [monAvisId, setMonAvisId] = useState<number | null>(null)
  const [editingAvis, setEditingAvis] = useState(false)
  const [maPos, setMaPos] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMaPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { timeout: 6000 }
      )
    }
  }, [])
  const distMenu = distanceKm(maPos?.lat, maPos?.lng, store.latitude, store.longitude)

  const chargerAvis = () => clientApi.avis(store.id).then((a) => setAvis(Array.isArray(a) ? a : [])).catch(() => {})

  useEffect(() => {
    Promise.all([clientApi.produits(store.id), clientApi.avis(store.id), clientApi.monAvis(store.id, acheteur.id)])
      .then(([p, a, mine]) => {
        setProduits(Array.isArray(p) ? p : [])
        setAvis(Array.isArray(a) ? a : [])
        if (mine && mine.existe) {
          setMonAvisId(mine.id!); setMyNote(mine.note!); setMyComment(mine.commentaire || ''); setAvisDone(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [store.id, acheteur.id])

  useEffect(() => {
    if (cart.length > 0) localStorage.setItem('orania_cart', JSON.stringify({ storeId: store.id, storeName: store.nom, items: cart }))
    else localStorage.removeItem('orania_cart')
  }, [cart, store.id, store.nom])

  const add = (p: Produit) => {
    try {
      const raw = localStorage.getItem('orania_cart')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.storeId && parsed.storeId !== store.id && (parsed.items?.length > 0)) {
          const ok = window.confirm(`Votre panier contient déjà des produits de « ${parsed.storeName || 'un autre commerce'} ».\n\nVider le panier et commander ici ?`)
          if (!ok) return
          localStorage.removeItem('orania_cart')
          setCart([{ produit: p, quantite: 1 }])
          return
        }
      }
    } catch {}
    setCart((prev) => { const f = prev.find((i) => i.produit.id === p.id); return f ? prev.map((i) => i.produit.id === p.id ? { ...i, quantite: i.quantite + 1 } : i) : [...prev, { produit: p, quantite: 1 }] })
  }
  const remove = (id: number) => setCart((prev) => { const f = prev.find((i) => i.produit.id === id); return f && f.quantite > 1 ? prev.map((i) => i.produit.id === id ? { ...i, quantite: i.quantite - 1 } : i) : prev.filter((i) => i.produit.id !== id) })
  const qty = (id: number) => cart.find((i) => i.produit.id === id)?.quantite ?? 0
  const prixEff = (p: Produit) => Number(p.prix_promo != null ? p.prix_promo : p.prix)
  const totalItems = cart.reduce((s, i) => s + i.quantite, 0)
  const totalPrice = cart.reduce((s, i) => s + prixEff(i.produit) * i.quantite, 0)

  const placeOrder = async () => {
    setOrdering(true)
    let pos: { latitude?: number; longitude?: number } = {}
    if (livraison) {
      if (position) {
        pos = { latitude: position.lat, longitude: position.lng }
      } else if (navigator.geolocation) {
        try {
          const p = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 }))
          pos = { latitude: p.coords.latitude, longitude: p.coords.longitude }
        } catch {}
      }
    }
    try {
      const cmd = await clientApi.commander({
        acheteur_id: acheteur.id, fournisseur_id: store.id, avec_livraison: livraison,
        ...pos,
        produits: cart.map((i) => ({ produit_id: i.produit.id, quantite: i.quantite })),
      })
      setOrderCode(cmd.code_confirmation || '------')
    } catch { setOrderCode('------') }
    setCart([]); localStorage.removeItem('orania_cart'); setShowSheet(false); setOrdering(false)
  }

  const groupes: Record<string, Produit[]> = {}
  produits.forEach((p) => { const c = p.categorie || 'Autre'; (groupes[c] = groupes[c] || []).push(p) })
  const banner = imgUrl(store.photo)
  const ouvert = magasinOuvert(store.heure_ouverture, store.heure_fermeture)

  if (ouvert === false) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <div className="bg-white border-b border-stone-100 px-4 py-3.5 flex items-center gap-3">
          <button onClick={onBack} title="Retour" className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700 shrink-0"><ArrowLeft size={20} /></button>
          <h2 className="font-extrabold text-stone-800 truncate">{store.nom}</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-28 h-28 bg-stone-200 rounded-full flex items-center justify-center mb-6"><span className="text-6xl">🌙</span></div>
          <h1 className="text-2xl font-extrabold text-stone-800 mb-2">Magasin fermé</h1>
          <p className="text-stone-500 mb-6">Ce commerce est actuellement fermé.</p>
          <button onClick={onBack} className="bg-amber-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-200 flex items-center gap-1.5"><ArrowLeft size={16} /> Retour</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-36">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20 shadow-sm shadow-stone-50">
        <div className="px-4 py-3.5 flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={onBack} title="Retour" className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700 shrink-0"><ArrowLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-stone-800 truncate text-base">{store.nom}</h2>
            <div className="flex items-center gap-2">
              <StarRating note={Math.round(store.note_moyenne ?? 0)} />
              <span className="text-xs text-stone-400">{store.note_moyenne ? store.note_moyenne.toFixed(1) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {banner && <div className="relative h-40 bg-amber-50 overflow-hidden max-w-lg mx-auto"><img src={banner} alt={store.nom} className="w-full h-full object-cover" /></div>}

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading ? <Spinner label="Chargement de la carte…" /> : (
          <div className="space-y-6">
            {Object.entries(groupes).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="font-bold text-stone-800 text-sm mb-3 uppercase tracking-wider">{cat}</h3>
                <div className="space-y-3">
                  {items.map((p) => (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-stone-800 text-sm">{p.nom}</h4>
                        {p.ingredients && <p className="text-xs text-stone-400 truncate">{p.ingredients}</p>}
                        <p className="text-sm font-extrabold text-amber-600 mt-1">{fmtDA(prixEff(p))}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {qty(p.id) > 0 && (
                          <>
                            <button onClick={() => remove(p.id)} className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 font-bold">-</button>
                            <span className="font-bold text-sm w-4 text-center">{qty(p.id)}</span>
                          </>
                        )}
                        <button onClick={() => add(p)} className="w-8 h-8 rounded-xl bg-amber-500 text-white font-bold">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-30">
          <button onClick={() => setShowSheet(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold p-4 rounded-2xl shadow-xl flex items-center justify-between">
            <span className="bg-white/20 px-2.5 py-1 rounded-xl text-xs">{totalItems}</span>
            <span>Voir le panier</span>
            <span>{fmtDA(totalPrice)}</span>
          </button>
        </div>
      )}

      {showSheet && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-stone-800 text-lg">Votre commande</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.map((i) => (
                <div key={i.produit.id} className="flex justify-between text-sm">
                  <span>{i.quantite}x {i.produit.nom}</span>
                  <span className="font-bold">{fmtDA(prixEff(i.produit) * i.quantite)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t flex justify-between font-extrabold text-base">
              <span>Total</span>
              <span className="text-amber-600">{fmtDA(totalPrice)}</span>
            </div>
            <button onClick={placeOrder} disabled={ordering} className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl">
              {ordering ? 'Validation…' : 'Confirmer la commande'}
            </button>
            <button onClick={() => setShowSheet(false)} className="w-full text-stone-400 text-sm font-semibold py-2">Annuler</button>
          </div>
        </div>
      )}

      {orderCode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
            <h3 className="font-extrabold text-xl">Commande Envoyée !</h3>
            <p className="text-stone-400 text-sm">Code de confirmation :</p>
            <p className="text-3xl font-mono font-black text-amber-500 tracking-wider bg-amber-50 py-3 rounded-2xl">{orderCode}</p>
            <button onClick={() => { setOrderCode(null); onBack() }} className="w-full bg-stone-900 text-white font-bold py-3.5 rounded-2xl">Retour</button>
          </div>
        </div>
      )}
    </div>
  )
}