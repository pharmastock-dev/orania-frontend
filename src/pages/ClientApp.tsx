import { useState, useEffect } from 'react'
import { clientApi, type Acheteur, type Fournisseur, type Produit, type Avis } from '../lib/api'
import { StarRating, getCat, imgUrl, fmtDA, Spinner, magasinOuvert, hhmm, tempsLivraison } from '../lib/shared'
import { LogoOrania } from '../components/Logo'
import { MapPicker } from '../components/Map'
import { ArrowLeft, Search, MapPin, Clock, Bike, Flame, User, Phone, Store, Star, LogOut } from 'lucide-react'

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

  const logout = () => {
    localStorage.removeItem('acheteur'); localStorage.removeItem('client_page'); localStorage.removeItem('client_store')
    setAcheteur(null); setStore(null); onExit()
  }

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-stone-50 shadow-2xl relative overflow-x-hidden flex flex-col">
        {page === 'login' || !acheteur ? (
          <LoginPage onLogin={login} onExit={onExit} />
        ) : page === 'menu' && store ? (
          <MenuPage acheteur={acheteur} store={store} onBack={goStores} />
        ) : (
          <StoresPage acheteur={acheteur} onSelect={goMenu} onRetour={onExit} onLogout={logout} />
        )}
      </div>
    </div>
  )
}

function CompteModal({ acheteur, onClose, onLogout }: { acheteur: Acheteur; onClose: () => void; onLogout: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-stone-800 text-lg">Mon Compte</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold p-1">✕</button>
        </div>
        <div className="space-y-3 mb-6">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
            <User className="text-amber-500 shrink-0" size={20} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Nom</p>
              <p className="text-sm font-bold text-stone-800 truncate">{acheteur.nom}</p>
            </div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
            <Phone className="text-amber-500 shrink-0" size={20} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Téléphone</p>
              <p className="text-sm font-bold text-stone-800 truncate">{acheteur.telephone}</p>
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
    <div className="min-h-screen w-full bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-between px-4 py-6">
      <div className="w-full flex flex-col items-center my-auto py-4">
        <div className="mb-6 text-center shrink-0">
          <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-3 shadow-xl shadow-black/5 border border-stone-100">
            <LogoOrania size={56} />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Orania</h1>
          <p className="text-stone-400 text-xs mt-0.5">Tout Oran, en un clic</p>
        </div>

        <div className="w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 border border-stone-100/80">
          <h2 className="text-lg font-bold text-stone-800 mb-1">Bienvenue 👋</h2>
          <p className="text-stone-400 text-xs mb-5">Entrez votre nom et téléphone pour continuer.</p>
          
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Votre nom complet</label>
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value.replace(/[^a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ '\\-]/g, ''))} placeholder="Ex : Amira Bouali"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all text-sm" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Numéro de téléphone</label>
              <input type="tel" inputMode="numeric" value={tel} onChange={(e) => setTel(e.target.value.replace(/[^0-9]/g, ''))} placeholder="05 XX XX XX XX" onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all text-sm" />
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-500 text-xs rounded-xl px-3.5 py-2">{error}</div>}

            <button onClick={submit} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-200/80 disabled:opacity-60 text-sm mt-1">
              {loading ? 'Connexion…' : 'Continuer →'}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-400">💵 Paiement uniquement en <strong>espèces</strong></p>
            <button onClick={onExit} className="text-xs text-stone-400 hover:text-stone-600 mt-2 transition-colors inline-flex items-center gap-1 font-medium"><ArrowLeft size={13} /> Changer d'espace</button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        <h3 className="font-bold text-stone-800 text-sm leading-tight mb-1.5 truncate">{store.nom}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StarRating note={Math.round(store.note_moyenne ?? 0)} />
          <span className="text-xs text-stone-400">{store.note_moyenne ? store.note_moyenne.toFixed(1) : '—'}{store.nb_avis ? ` · ${store.nb_avis} avis` : ''}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
    <div className="flex flex-col pb-10">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={onRetour} title="Retour à l'accueil" className="shrink-0 w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <LogoOrania size={22} />
                <h1 className="font-extrabold text-stone-900 text-base truncate">Orania</h1>
              </div>
              <p className="text-[11px] text-stone-400 truncate">Bonjour, {acheteur.nom} 👋</p>
            </div>
          </div>

          <button onClick={() => setShowCompte(true)} className="shrink-0 text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-2 rounded-xl hover:bg-stone-200 active:scale-95 transition-all flex items-center gap-1">
            <User size={14} /> Compte
          </button>
        </div>

        {showCompte && <CompteModal acheteur={acheteur} onClose={() => setShowCompte(false)} onLogout={onLogout} />}

        <div className="px-4 pb-3 pt-1 flex gap-2">
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher : pizza, thé, sushi…"
              className="w-full pl-9 pr-8 py-2.5 bg-stone-100 border border-transparent rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs p-1">✕</button>}
          </div>
          <button onClick={() => setShowFiltre((v) => !v)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${showFiltre ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
            ⚙️ {tri === 'distance' ? 'Proche' : 'Top'}
          </button>
        </div>

        {showFiltre && (
          <div className="px-4 pb-3">
            <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-2 flex gap-2">
              <button onClick={() => setTri('distance')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${tri === 'distance' ? 'bg-amber-500 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>📍 Plus proches</button>
              <button onClick={() => setTri('etoiles')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${tri === 'etoiles' ? 'bg-amber-500 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>⭐ Mieux notés</button>
            </div>
          </div>
        )}

        {/* scroll-x propre sans casser la page */}
        <div className="overflow-x-auto no-scrollbar scrollbar-hide px-4 pb-2">
          <div className="flex gap-1.5 w-max py-0.5">
            {categories.map((c) => {
              const colors = c === 'Tous' ? null : getCat(c)
              const active = cat === c
              return (
                <button key={c} onClick={() => setCat(c)} className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${active ? (c === 'Tous' ? 'bg-amber-500 text-white' : `${colors!.pill} text-white`) : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar scrollbar-hide px-4 pb-3 border-t border-stone-50 pt-2">
          <div className="flex gap-1.5 w-max py-0.5">
            <button onClick={() => setFiltreOuvert(filtreOuvert === 'ouvert' ? 'tous' : 'ouvert')} className={`shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full transition-all flex items-center gap-1 whitespace-nowrap ${filtreOuvert === 'ouvert' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'}`}>● Ouvert</button>
            <button onClick={() => setFiltreOuvert(filtreOuvert === 'ferme' ? 'tous' : 'ferme')} className={`shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full transition-all flex items-center gap-1 whitespace-nowrap ${filtreOuvert === 'ferme' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'}`}>● Fermé</button>
            <button onClick={() => setFiltreGratuit(!filtreGratuit)} className={`shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full transition-all flex items-center gap-1 whitespace-nowrap ${filtreGratuit ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}>🛵 Livraison gratuite</button>
            <button onClick={() => setFiltrePromo(!filtrePromo)} className={`shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full transition-all flex items-center gap-1 whitespace-nowrap ${filtrePromo ? 'bg-pink-500 text-white' : 'bg-stone-100 text-stone-600'}`}>🔥 En promo</button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading && <Spinner label="Chargement des commerces…" />}
        {error && !loading && (
          <div className="text-center py-16"><p className="text-4xl mb-2">⚡</p><p className="text-stone-600 font-semibold text-sm">API inaccessible</p></div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16"><p className="text-4xl mb-2">🔍</p><p className="text-stone-600 font-semibold text-sm">Aucun résultat trouvé</p></div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3.5">
            {filtered.map((s) => {
              const dist = distanceKm(maPos?.lat, maPos?.lng, s.latitude, s.longitude)
              return <StoreCard key={s.id} store={s} distance={dist} onClick={() => onSelect(s)} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}

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

  const chargerAvis = () => clientApi.avis(store.id).then((a) => setAvis(Array.isArray(a) ? a : [])).catch(() => {})

  useEffect(() => {
    Promise.all([clientApi.produits(store.id), clientApi.avis(store.id), clientApi.monAvis(store.id, acheteur.id)])
      .then(([p, a, mine]) => {
        setProduits(Array.isArray(p) ? p : [])
        setAvis(Array.isArray(a) ? a : [])
        if (mine && mine.existe) { setMyNote(mine.note!); setMyComment(mine.commentaire || ''); setAvisDone(true) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [store.id, acheteur.id])

  const add = (p: Produit) => {
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
    if (livraison && position) pos = { latitude: position.lat, longitude: position.lng }
    
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

  const sendAvis = async () => {
    if (!myNote) return
    try {
      await clientApi.posterAvis({ acheteur_id: acheteur.id, fournisseur_id: store.id, note: myNote, commentaire: myComment })
      setAvisDone(true); chargerAvis()
    } catch {}
  }

  // Regroupement par catégorie
  const groupes: Record<string, Produit[]> = {}
  produits.forEach((p) => {
    const c = p.categorie || 'Menu / Produits'
    if (!groupes[c]) groupes[c] = []
    groupes[c].push(p)
  })

  return (
    <div className="flex flex-col pb-36">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3.5 flex items-center gap-3">
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

      <div className="px-4 pt-4">
        {loading ? <Spinner label="Chargement de la carte…" /> : (
          <div className="space-y-6">
            {Object.keys(groupes).length === 0 ? (
              <p className="text-center text-stone-400 text-xs py-8">Aucun produit disponible pour ce magasin.</p>
            ) : (
              Object.entries(groupes).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="font-bold text-stone-800 text-sm mb-3 uppercase tracking-wider">{cat}</h3>
                  <div className="space-y-3">
                    {items.map((p) => (
                      <div key={p.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-800 text-sm truncate">{p.nom}</h4>
                          {p.ingredients && <p className="text-xs text-stone-400 truncate">{p.ingredients}</p>}
                          <p className="text-sm font-extrabold text-amber-600 mt-1">{fmtDA(prixEff(p))}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
              ))
            )}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-stone-200">
          <h3 className="font-extrabold text-stone-800 text-base mb-4 flex items-center gap-2"><Star className="text-amber-500" size={18} /> Avis des clients</h3>
          {avis.length === 0 ? <p className="text-xs text-stone-400 italic">Aucun avis pour le moment.</p> : (
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto no-scrollbar scrollbar-hide">
              {avis.map((a, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-stone-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-stone-700 truncate">{a.nom_acheteur || 'Client'}</span>
                    <StarRating note={a.note} />
                  </div>
                  {a.commentaire && <p className="text-xs text-stone-500 break-words">{a.commentaire}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
            <h4 className="font-bold text-stone-800 text-xs mb-2">{avisDone ? 'Votre avis est enregistré' : 'Donner votre avis'}</h4>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setMyNote(s)} className={`text-2xl ${s <= myNote ? 'text-amber-500' : 'text-stone-300'}`}>★</button>
              ))}
            </div>
            <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Un commentaire ? (Optionnel)" className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white mb-3" rows={2}></textarea>
            <button onClick={sendAvis} disabled={!myNote} className="w-full bg-amber-500 text-white text-xs font-bold py-3 rounded-xl disabled:opacity-50 shadow-md shadow-amber-200">Envoyer l'avis</button>
          </div>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-30">
          <button onClick={() => setShowSheet(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold p-4 rounded-2xl shadow-xl flex items-center justify-between">
            <span className="bg-white/20 px-2.5 py-1 rounded-xl text-xs">{totalItems}</span>
            <span>Voir le panier</span>
            <span>{fmtDA(totalPrice)}</span>
          </button>
        </div>
      )}

      {showSheet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar scrollbar-hide">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-stone-800 text-lg">Votre commande</h3>
              <button onClick={() => setShowSheet(false)} className="text-stone-400 font-bold p-1">✕</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar scrollbar-hide">
              {cart.map((i) => (
                <div key={i.produit.id} className="flex justify-between text-sm py-1 border-b border-stone-50">
                  <span className="text-stone-700 truncate pr-2">{i.quantite}x {i.produit.nom}</span>
                  <span className="font-bold text-stone-800 shrink-0">{fmtDA(prixEff(i.produit) * i.quantite)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-stone-100 flex justify-between font-extrabold text-stone-900">
              <span>Total</span>
              <span className="text-amber-600">{fmtDA(totalPrice)}</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-2xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                <input type="checkbox" checked={livraison} onChange={(e) => setLivraison(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-400" />
                Demander la livraison à domicile
              </label>
              {livraison && (
                <div className="pt-2">
                  <p className="text-[11px] text-stone-400 mb-2">Sélectionnez votre position sur la carte :</p>
                  <MapPicker onPositionSelect={(lat, lng) => setPosition({ lat, lng })} />
                </div>
              )}
            </div>
            <button onClick={placeOrder} disabled={ordering} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all text-sm">
              {ordering ? 'Validation…' : 'Confirmer la commande'}
            </button>
          </div>
        </div>
      )}

      {orderCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 text-center max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
            <h3 className="font-extrabold text-stone-900 text-xl">Commande envoyée !</h3>
            <p className="text-xs text-stone-500">Donnez ce code au livreur ou au commerçant :</p>
            <div className="bg-amber-50 text-amber-600 font-mono text-3xl font-black py-3 rounded-2xl tracking-widest border border-amber-200">{orderCode}</div>
            <button onClick={() => setOrderCode(null)} className="w-full bg-stone-900 text-white font-bold py-3.5 rounded-2xl text-sm">Compris</button>
          </div>
        </div>
      )}
    </div>
  )
}