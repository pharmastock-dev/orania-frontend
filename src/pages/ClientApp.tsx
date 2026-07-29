import { useState, useEffect } from 'react'
import { clientApi, reclamationApi, type Acheteur, type Fournisseur, type Produit, type Avis } from '../lib/api'
import { StarRating, getCat, imgUrl, fmtDA, Spinner, magasinOuvert, hhmm, tempsLivraison } from '../lib/shared'
import { catEmoji } from '../lib/categories'
import { LogoOrania } from '../components/Logo'
import { MapPicker, MapView } from '../components/Map'

interface CartItem { produit: Produit; quantite: number }
type CPage = 'login' | 'stores' | 'menu'


export function ClientApp({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState<CPage>('login')
  const [acheteur, setAcheteur] = useState<Acheteur | null>(null)
  const [store, setStore] = useState<Fournisseur | null>(null)

  // restaurer la session ET la dernière page/magasin visités
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
    // on ferme le sous-écran via l'UI : reculer dans l'historique (déclenche popstate géré)
    if (((window as any).__oraniaBackDepth || 0) > 0) { window.history.back(); return }
    setStore(null); setPage('stores')
  }
  const goMenu = (s: Fournisseur) => {
    localStorage.setItem('client_page', 'menu'); localStorage.setItem('client_store', JSON.stringify(s))
    // signaler à App qu'un sous-écran est ouvert (le bouton retour reviendra aux magasins)
    ;(window as any).__oraniaBackDepth = ((window as any).__oraniaBackDepth || 0) + 1
    window.history.pushState({ clientPage: 'menu' }, '')
    setStore(s); setPage('menu')
  }

  // bouton retour physique (téléphone) ou flèche navigateur (PC)
  useEffect(() => {
    const onPop = () => {
      setPage((cur) => {
        if (cur === 'menu') {
          // fermer le menu et revenir à la liste des magasins
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
  // retour à l'accueil SANS effacer le compte (le client reste connecté)
  const retourAccueil = () => { onExit() }
  // déconnexion complète : efface le compte, il faudra re-saisir nom+téléphone
  const logout = () => {
    localStorage.removeItem('acheteur'); localStorage.removeItem('client_page'); localStorage.removeItem('client_store')
    setAcheteur(null); setStore(null); onExit()
  }

  if (page === 'login' || !acheteur) return <LoginPage onLogin={login} onExit={onExit} />
  if (page === 'menu' && store) return <MenuPage acheteur={acheteur} store={store} onBack={goStores} />
  return <StoresPage acheteur={acheteur} onSelect={goMenu} onRetour={retourAccueil} onLogout={logout} />
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
          <button onClick={onExit} className="text-xs text-stone-300 hover:text-stone-500 mt-2 transition-colors">← Changer d'espace</button>
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
          : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl opacity-30">🏪</span></div>}
        {open !== null && <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${open ? 'bg-emerald-500 text-white' : 'bg-stone-400/80 text-white'}`}>{open ? '● Ouvert' : '● Fermé'}</span>}
        <span className={`absolute bottom-2.5 left-2.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>{store.categorie}</span>
      </div>
      <div className="px-4 py-3">
        <h3 className="font-bold text-stone-800 text-sm leading-tight mb-1.5">{store.nom}</h3>
        <div className="flex items-center gap-1.5">
          <StarRating note={Math.round(store.note_moyenne ?? 0)} />
          <span className="text-xs text-stone-400">{store.note_moyenne ? store.note_moyenne.toFixed(1) : '—'}{store.nb_avis ? ` · ${store.nb_avis} avis` : ''}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {store.heure_ouverture && <p className="text-[11px] text-stone-400">🕐 {hhmm(store.heure_ouverture)}–{hhmm(store.heure_fermeture)}</p>}
          {distance != null && <p className="text-[11px] text-amber-600 font-semibold">📍 {distance < 1 ? Math.round(distance * 1000) + ' m' : distance.toFixed(1) + ' km'}</p>}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {distance != null && tempsLivraison(distance) && (
            <span className="text-[11px] text-stone-600 font-medium bg-stone-100 px-2 py-0.5 rounded-full">🛵 {tempsLivraison(distance)}</span>
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

// distance approximative (Haversine) en km
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
  const [showFiltre, setShowFiltre] = useState(false)
  const [maPos, setMaPos] = useState<{ lat: number; lng: number } | null>(null)
  const [posErr, setPosErr] = useState(false)

  useEffect(() => {
    clientApi.fournisseurs().then((d) => { setStores(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => { setError(true); setLoading(false) })
  }, [])

  // demander la géoloc quand on trie par distance
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
    // recherche : nom du commerce, sa catégorie, OU un de ses produits / catégories de produits
    if (s.nom.toLowerCase().includes(q)) return true
    if (s.categorie.toLowerCase().includes(q)) return true
    if ((s.produits_noms || []).some((n) => n.toLowerCase().includes(q))) return true
    if ((s.produits_categories || []).some((c) => c.toLowerCase().includes(q))) return true
    return false
  })

  // filtre ouvert/fermé
  if (filtreOuvert !== 'tous') {
    filtered = filtered.filter((s) => {
      const o = magasinOuvert(s.heure_ouverture, s.heure_fermeture)
      if (filtreOuvert === 'ouvert') return o === true
      if (filtreOuvert === 'ferme') return o === false
      return true
    })
  }
  if (filtreGratuit) {
    filtered = filtered.filter((s) => s.livraison_gratuite === true)
  }

  // tri
  filtered = [...filtered].sort((a, b) => {
    if (tri === 'etoiles') return (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0)
    // distance
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
            className="shrink-0 w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700 text-lg font-bold">←</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><LogoOrania size={26} /><h1 className="font-extrabold text-stone-900 text-lg truncate">Orania</h1></div>
            <p className="text-xs text-stone-400 ml-8 truncate">Bonjour, {acheteur.nom} 👋</p>
          </div>
          <button onClick={() => setShowCompte(true)} className="shrink-0 text-xs text-stone-500 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-amber-50">👤 Compte</button>
        </div>
        {showCompte && <CompteModal acheteur={acheteur} onClose={() => setShowCompte(false)} onLogout={onLogout} />}

        {/* Barre recherche + bouton filtre */}
        <div className="px-4 pb-3 pt-1 max-w-lg mx-auto flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none">🔍</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher : pizza, thé, sushi…"
              className="w-full pl-10 pr-4 py-3 bg-stone-100 border border-transparent rounded-2xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">✕</button>}
          </div>
          <button onClick={() => setShowFiltre((v) => !v)}
            className={`px-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${showFiltre ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            ⚙️ {tri === 'distance' ? 'Proche' : 'Top'}
          </button>
        </div>

        {/* Panneau filtre */}
        {showFiltre && (
          <div className="px-4 pb-3 max-w-lg mx-auto">
            <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3 flex gap-2">
              <button onClick={() => setTri('distance')} className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${tri === 'distance' ? 'bg-amber-500 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>📍 Plus proches</button>
              <button onClick={() => setTri('etoiles')} className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${tri === 'etoiles' ? 'bg-amber-500 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>⭐ Mieux notés</button>
            </div>
            {tri === 'distance' && posErr && <p className="text-[11px] text-amber-600 mt-2">📍 Localisation refusée — tri par distance indisponible.</p>}
          </div>
        )}

        {/* Pastilles catégories */}
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

        {/* Filtre Ouvert / Fermé */}
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
            🛵 Livraison gratuite
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
  const [cart, setCart] = useState<CartItem[]>([])
  const [showSheet, setShowSheet] = useState(false)
  const [livraison, setLivraison] = useState(true)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [ordering, setOrdering] = useState(false)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [showReviews, setShowReviews] = useState(false)
  const [myNote, setMyNote] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [avisDone, setAvisDone] = useState(false)
  const [filtreCat, setFiltreCat] = useState('Tous')
  const [monAvisId, setMonAvisId] = useState<number | null>(null)
  const [editingAvis, setEditingAvis] = useState(false)
  const [maPos, setMaPos] = useState<{ lat: number; lng: number } | null>(null)

  // récupérer la position pour estimer temps + distance
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

  const add = (p: Produit) => setCart((prev) => { const f = prev.find((i) => i.produit.id === p.id); return f ? prev.map((i) => i.produit.id === p.id ? { ...i, quantite: i.quantite + 1 } : i) : [...prev, { produit: p, quantite: 1 }] })
  const remove = (id: number) => setCart((prev) => { const f = prev.find((i) => i.produit.id === id); return f && f.quantite > 1 ? prev.map((i) => i.produit.id === id ? { ...i, quantite: i.quantite - 1 } : i) : prev.filter((i) => i.produit.id !== id) })
  const qty = (id: number) => cart.find((i) => i.produit.id === id)?.quantite ?? 0
  const totalItems = cart.reduce((s, i) => s + i.quantite, 0)
  const totalPrice = cart.reduce((s, i) => s + Number(i.produit.prix) * i.quantite, 0)

  const placeOrder = async () => {
    setOrdering(true)
    // pour la livraison : position choisie sur la carte en priorité, sinon GPS
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
    setCart([]); setShowSheet(false); setOrdering(false)
  }

  const submitAvis = async () => {
    if (myNote === 0) return
    try {
      const r = await clientApi.noterAvis({ acheteur_id: acheteur.id, fournisseur_id: store.id, note: myNote, commentaire: myComment || null })
      if (r && r.id) setMonAvisId(r.id)
    } catch {}
    await chargerAvis()
    setAvisDone(true); setEditingAvis(false)
  }

  const supprimerMonAvis = async () => {
    if (!monAvisId) return
    if (!confirm('Supprimer votre avis ?')) return
    try { await clientApi.supprimerMonAvis(monAvisId) } catch {}
    setMonAvisId(null); setMyNote(0); setMyComment(''); setAvisDone(false); setEditingAvis(false)
    await chargerAvis()
  }

  // grouper produits par catégorie
  const groupes: Record<string, Produit[]> = {}
  produits.forEach((p) => { const c = p.categorie || 'Autre'; (groupes[c] = groupes[c] || []).push(p) })
  const cats = Object.keys(groupes).sort()
  const banner = imgUrl(store.photo)
  const ouvert = magasinOuvert(store.heure_ouverture, store.heure_fermeture)

  // Magasin fermé → grande page bloquante
  if (ouvert === false) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <div className="bg-white border-b border-stone-100 px-4 py-3.5 flex items-center gap-3">
          <button onClick={onBack} title="Retour" className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700 text-lg font-bold shrink-0">←</button>
          <h2 className="font-extrabold text-stone-800 truncate">{store.nom}</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-28 h-28 bg-stone-200 rounded-full flex items-center justify-center mb-6"><span className="text-6xl">🌙</span></div>
          <h1 className="text-2xl font-extrabold text-stone-800 mb-2">Magasin fermé</h1>
          <p className="text-stone-500 mb-1">Ce commerce est actuellement fermé.</p>
          <p className="text-stone-500 mb-6">Vous ne pouvez pas commander pour le moment.</p>
          {store.heure_ouverture && (
            <div className="bg-white border border-stone-200 rounded-2xl px-6 py-4 mb-8">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Horaires</p>
              <p className="text-lg font-bold text-stone-700">🕐 {hhmm(store.heure_ouverture)} – {hhmm(store.heure_fermeture)}</p>
            </div>
          )}
          <button onClick={onBack} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-200">← Retour aux commerces</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-36">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20 shadow-sm shadow-stone-50">
        <div className="px-4 py-3.5 flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={onBack} title="Retour" className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700 text-lg font-bold shrink-0">←</button>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-stone-800 truncate text-base">{store.nom}</h2>
            <div className="flex items-center gap-2">
              <StarRating note={Math.round(store.note_moyenne ?? 0)} />
              <span className="text-xs text-stone-400">{store.note_moyenne ? store.note_moyenne.toFixed(1) : '—'}{store.nb_avis ? ` · ${store.nb_avis} avis` : ''}</span>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${getCat(store.categorie).bg} ${getCat(store.categorie).text}`}>{store.categorie}</span>
        </div>
      </div>

      {banner && <div className="relative h-40 bg-amber-50 overflow-hidden max-w-lg mx-auto"><img src={banner} alt={store.nom} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" /></div>}

      {/* Barre infos livraison : frais | temps | note */}
      <div className="max-w-lg mx-auto px-4 pt-3">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm grid grid-cols-3 divide-x divide-stone-100">
          <div className="px-2 py-3 text-center">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Livraison</p>
            <p className="text-sm font-bold text-stone-800">
              {store.livraison_gratuite ? <span className="text-emerald-600">Gratuite</span>
                : (store.frais_min != null ? `${store.frais_min}${store.frais_max && store.frais_max !== store.frais_min ? '–'+store.frais_max : ''} DA` : '—')}
            </p>
          </div>
          <div className="px-2 py-3 text-center">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Temps</p>
            <p className="text-sm font-bold text-stone-800">{tempsLivraison(distMenu) || '—'}</p>
          </div>
          <div className="px-2 py-3 text-center">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Note</p>
            <p className="text-sm font-bold text-stone-800">{store.note_moyenne ? `★ ${store.note_moyenne.toFixed(1)}` : '—'}</p>
          </div>
        </div>
      </div>

      {(store.adresse || store.telephone || store.heure_ouverture) && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            {store.adresse && <span>📍 {store.adresse}</span>}
            {store.telephone && <a href={`tel:${store.telephone}`} className="text-blue-600 hover:underline">📞 {store.telephone}</a>}
            {store.heure_ouverture && <span>🕐 {hhmm(store.heure_ouverture)}–{hhmm(store.heure_fermeture)}</span>}
          </div>
        </div>
      )}

      {store.latitude != null && store.longitude != null && (
        <LocalisationMagasin store={store} />
      )}

      {store.presentation && <PourquoiNousChoisir texte={store.presentation} />}

      {loading ? <Spinner /> : (
        <div className="px-4 py-5 space-y-7 max-w-lg mx-auto">
          {produits.length === 0 ? (
            <div className="text-center py-12"><p className="text-4xl mb-3">🍽️</p><p className="text-stone-500">Aucun produit disponible</p></div>
          ) : (
            <>
            {cats.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mt-2">
                {['Tous', ...cats].map((c) => (
                  <button key={c} onClick={() => setFiltreCat(c)}
                    className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${filtreCat === c ? 'bg-amber-500 text-white shadow-sm' : 'bg-stone-100 text-stone-500'}`}>
                    {c === 'Tous' ? 'Tous' : `${catEmoji(c)} ${c}`}
                  </button>
                ))}
              </div>
            )}
            {cats.filter((cat) => filtreCat === 'Tous' || cat === filtreCat).map((cat) => (
              <div key={cat}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2"><span className="flex-1 h-px bg-stone-100" />{catEmoji(cat)} {cat}<span className="flex-1 h-px bg-stone-100" /></h3>
                <div className="space-y-3">
                  {groupes[cat].map((p) => {
                    const q = qty(p.id); const pimg = imgUrl(p.image_url)
                    return (
                      <div key={p.id} className={`bg-white rounded-2xl p-4 flex gap-3 shadow-sm border border-stone-100 transition-opacity ${!p.disponible ? 'opacity-45' : ''}`}>
                        {pimg && <div className="rounded-xl bg-amber-50 overflow-hidden shrink-0" style={{ width: 70, height: 70 }}><img src={pimg} alt={p.nom} className="w-full h-full object-cover" /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-stone-800 text-sm">{p.nom}</p>
                          {p.ingredients && <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">🧾 {p.ingredients}</p>}
                          {!p.disponible && <span className="inline-block mt-1 text-[10px] font-semibold bg-red-50 text-red-400 px-2 py-0.5 rounded-full">Indisponible</span>}
                          <p className="text-amber-600 font-extrabold text-sm mt-1.5">{fmtDA(p.prix)}</p>
                        </div>
                        {p.disponible && (
                          <div className="flex items-center gap-2 shrink-0 self-center">
                            {q > 0 ? (
                              <>
                                <button onClick={() => remove(p.id)} className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 font-bold text-base flex items-center justify-center hover:bg-stone-200 active:scale-90 transition-all">−</button>
                                <span className="text-sm font-bold text-stone-700 w-5 text-center">{q}</span>
                                <button onClick={() => add(p)} className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-base flex items-center justify-center hover:bg-amber-600 active:scale-90 transition-all shadow-sm shadow-amber-200">+</button>
                              </>
                            ) : (
                              <button onClick={() => add(p)} className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-base flex items-center justify-center hover:bg-amber-600 active:scale-90 transition-all shadow-sm shadow-amber-200">+</button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            </>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setShowReviews((v) => !v)}>
              <div className="flex items-center gap-2"><span className="text-base">⭐</span><span className="font-bold text-stone-800">Avis clients</span>{avis.length > 0 && <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{avis.length}</span>}</div>
              <span className="text-stone-400 text-sm" style={{ display: 'inline-block', transform: showReviews ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>
            {showReviews && (
              <div className="px-5 pb-5 space-y-5">
                {(!avisDone || editingAvis) ? (
                  <div className="bg-amber-50 rounded-2xl p-4">
                    <p className="text-sm font-bold text-stone-700 mb-3">{editingAvis ? 'Modifier votre avis' : 'Donner votre avis'}</p>
                    <StarRating note={myNote} size="lg" onRate={setMyNote} />
                    {myNote > 0 && <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Votre commentaire (optionnel)…" rows={2} className="mt-3 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />}
                    <div className="flex gap-2 mt-3">
                      <button onClick={submitAvis} disabled={myNote === 0} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40">{editingAvis ? 'Enregistrer' : 'Envoyer mon avis'}</button>
                      {editingAvis && <button onClick={() => setEditingAvis(false)} className="bg-stone-200 text-stone-600 text-sm font-semibold px-4 py-2.5 rounded-xl">Annuler</button>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-emerald-600 font-semibold text-sm">✓ Votre avis</p>
                      <StarRating note={myNote} />
                    </div>
                    {myComment && <p className="text-sm text-stone-600 mt-2">{myComment}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setEditingAvis(true)} className="bg-white border border-stone-200 text-stone-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-50">✏️ Modifier</button>
                      <button onClick={supprimerMonAvis} className="bg-red-50 text-red-500 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-100">🗑️ Supprimer</button>
                    </div>
                  </div>
                )}
                {avis.length === 0 ? <p className="text-stone-400 text-sm text-center py-3">Soyez le premier à laisser un avis</p> : (
                  <div className="space-y-4">
                    {avis.filter((a) => a.acheteur_id !== acheteur.id).map((a) => (
                      <div key={a.id} className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between mb-1"><span className="text-sm font-bold text-stone-700">{a.acheteur_nom}</span><StarRating note={a.note} /></div>
                        {a.commentaire && <p className="text-xs text-stone-500 leading-relaxed">{a.commentaire}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-4 bg-white/80 backdrop-blur-md border-t border-stone-100">
          <div className="max-w-lg mx-auto">
            <button onClick={() => setShowSheet(true)} className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl shadow-amber-200/70 transition-all">
              <div className="bg-amber-400/50 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{totalItems}</div>
              <span className="font-bold text-base">Commander</span>
              <span className="font-extrabold text-base">{fmtDA(totalPrice)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Order sheet */}
      {showSheet && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => !ordering && setShowSheet(false)}>
          <div className="bg-white w-full rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-extrabold text-stone-800 mb-4">Récapitulatif</h3>
            <div className="space-y-2.5 mb-4">
              {cart.map((item) => (
                <div key={item.produit.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span className="bg-amber-100 text-amber-700 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center">{item.quantite}</span><span className="text-stone-700">{item.produit.nom}</span></div>
                  <span className="text-stone-500 font-semibold">{fmtDA(Number(item.produit.prix) * item.quantite)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center font-extrabold text-stone-800 text-base border-t border-stone-100 pt-4 mb-4"><span>Total produits</span><span>{fmtDA(totalPrice)}</span></div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-5"><p className="text-xs text-amber-700 font-medium">💵 Paiement en <strong>espèces</strong>. Le prix de livraison sera convenu avec le commerce au <strong>{acheteur.telephone}</strong>.</p></div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Mode de réception</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[{ val: true, emoji: '🛵', label: 'Avec livraison' }, { val: false, emoji: '🏃', label: 'À emporter' }].map(({ val, emoji, label }) => (
                <button key={label} onClick={() => setLivraison(val)} className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 font-semibold text-sm transition-all ${livraison === val ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}><span className="text-xl">{emoji}</span>{label}</button>
              ))}
            </div>
            {livraison && (
              <div className="mb-5">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">📍 Votre position de livraison</p>
                <p className="text-[11px] text-stone-400 mb-2">Déplacez le marqueur ou cliquez sur la carte pour indiquer où livrer.</p>
                <MapPicker value={position} onChange={setPosition} />
                {position && <p className="text-[11px] text-emerald-600 mt-1.5 font-semibold">✓ Position enregistrée</p>}
              </div>
            )}
            <button onClick={placeOrder} disabled={ordering} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-amber-200 disabled:opacity-60 text-base">{ordering ? 'Envoi…' : 'Confirmer la commande'}</button>
          </div>
        </div>
      )}

      {/* Success */}
      {orderCode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5"><span className="text-4xl">✅</span></div>
            <h3 className="text-2xl font-extrabold text-stone-800 mb-1.5">Commande envoyée !</h3>
            <p className="text-stone-400 text-sm mb-6">Votre code de confirmation</p>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-5"><p className="text-4xl font-extrabold tracking-[0.4em] text-amber-600 font-mono">{orderCode}</p></div>
            <p className="text-xs text-stone-400 mb-2">Le commerce <strong className="text-stone-600">{store.nom}</strong> vous contactera au</p>
            <p className="text-base font-bold text-stone-700 mb-7">{acheteur.telephone}</p>
            <button onClick={() => { setOrderCode(null); onBack() }} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl transition-all">Retour aux commerces</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modale compte + réclamation (client) ──────────────────────────────────────
function CompteModal({ acheteur, onClose, onLogout }: { acheteur: Acheteur; onClose: () => void; onLogout: () => void }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const envoyer = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await reclamationApi.envoyer({
        type_auteur: 'client', auteur_id: acheteur.id,
        auteur_nom: acheteur.nom, auteur_telephone: acheteur.telephone,
        message: message.trim(),
      })
      setSent(true); setMessage('')
    } catch {} finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-stone-800">Mon compte</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500">✕</button>
        </div>

        {/* Infos compte */}
        <div className="bg-stone-50 rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center text-xl">👤</div>
            <div><p className="text-[11px] text-stone-400 uppercase tracking-widest">Nom</p><p className="font-semibold text-stone-700">{acheteur.nom}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-xl">📞</div>
            <div><p className="text-[11px] text-stone-400 uppercase tracking-widest">Téléphone</p><p className="font-semibold text-stone-700">{acheteur.telephone}</p></div>
          </div>
        </div>

        {/* Réclamation */}
        <p className="text-sm font-bold text-stone-700 mb-2">📨 Une réclamation ?</p>
        {sent ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <p className="text-emerald-600 font-semibold text-sm">✓ Réclamation envoyée à l'administrateur</p>
            <button onClick={() => setSent(false)} className="text-xs text-stone-400 mt-2 hover:text-stone-600">Envoyer une autre</button>
          </div>
        ) : (
          <>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              placeholder="Décrivez votre problème ou suggestion…"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            <button onClick={envoyer} disabled={sending || !message.trim()}
              className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-50">
              {sending ? 'Envoi…' : 'Envoyer ma réclamation'}
            </button>
          </>
        )}

        {/* Déconnexion : efface le compte, il faudra re-saisir nom+téléphone */}
        <button onClick={() => { if (confirm('Se déconnecter ? Vous devrez ressaisir votre nom et téléphone.')) onLogout() }}
          className="w-full mt-4 border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-3 rounded-2xl transition-all">
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  )
}


// ─── "Pourquoi nous choisir" (client) ──────────────────────────────────────────
function PourquoiNousChoisir({ texte }: { texte: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-lg shadow-amber-200/50 active:scale-[0.98] transition-all">
        <span className="font-bold flex items-center gap-2">✨ Pourquoi nous choisir ?</span>
        <span style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>▼</span>
      </button>
      {open && (
        <div className="bg-white border border-amber-100 rounded-2xl p-4 mt-2 animate-in">
          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{texte}</p>
        </div>
      )}
    </div>
  )
}


// ─── Localisation + itinéraire du magasin (client) ─────────────────────────────
function LocalisationMagasin({ store }: { store: Fournisseur }) {
  const [open, setOpen] = useState(false)
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`
  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
        <span className="font-bold text-stone-700 flex items-center gap-2">🗺️ Où se trouve ce commerce ?</span>
        <span style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} className="text-stone-400">▼</span>
      </button>
      {open && (
        <div className="mt-2">
          <MapView lat={store.latitude!} lng={store.longitude!} height={220} />
          <a href={gmaps} target="_blank" rel="noopener"
            className="mt-2 flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-amber-500/30">
            🧭 Voir l'itinéraire pour récupérer ma commande
          </a>
          <p className="text-[11px] text-stone-400 text-center mt-1.5">Ouvre Google Maps avec le trajet et la distance jusqu'au commerce.</p>
        </div>
      )}
    </div>
  )
}
