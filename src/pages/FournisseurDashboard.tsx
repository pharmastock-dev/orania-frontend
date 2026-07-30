import { useState, useEffect, useCallback } from 'react'
import { fournisseurApi, reclamationApi, type Commande, type Produit, type Livreur, type LigneCommande, type Evaluation } from '../lib/api'
import { StarRating, Spinner, fmtDA, fmtDateHeure, statutInfo, imgUrl, estTerminee } from '../lib/shared'
import { MapView, MapPicker } from '../components/Map'
import { CATEGORIES_PRODUITS, catEmoji } from '../lib/categories'
import type { FournisseurSession } from './FournisseurAuth'
import { ArrowLeft, Package, UtensilsCrossed, Bike, Star, BarChart3, Store, Camera, Eye, EyeOff, Pencil, Trash2, Check, X, Plus } from 'lucide-react'

type Tab = 'commandes' | 'produits' | 'livreurs' | 'avis' | 'stats' | 'infos'

export function FournisseurDashboard({ session, onLogout }: { session: FournisseurSession; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('commandes')

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <div className="bg-[#12355B] text-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onLogout} title="Retour à l'accueil"
            className="shrink-0 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Store size={20} />
            <h1 className="font-bold truncate">{session.nom}</h1>
          </div>
          <button onClick={onLogout} className="shrink-0 text-xs text-stone-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors">
            Déconnexion
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {([
            ['commandes', 'Commandes', Package],
            ['produits', 'Menu', UtensilsCrossed],
            ['livreurs', 'Livreurs', Bike],
            ['avis', 'Avis', Star],
            ['stats', 'Statistiques', BarChart3],
            ['infos', 'Mon commerce', Store],
          ] as [Tab, string, React.ComponentType<{ size?: number }>][]).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                tab === key ? 'border-amber-400 text-white' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {tab === 'commandes' && <CommandesTab fid={session.id} />}
        {tab === 'produits' && <ProduitsTab fid={session.id} />}
        {tab === 'livreurs' && <LivreursTab fid={session.id} />}
        {tab === 'avis' && <AvisTab fid={session.id} />}
        {tab === 'stats' && <StatsTab fid={session.id} />}
        {tab === 'infos' && <InfosTab session={session} />}
      </div>
    </div>
  )
}

// ─── COMMANDES ────────────────────────────────────────────────────────────────

function CommandesTab({ fid }: { fid: number }) {
  const [corbeille, setCorbeille] = useState(false)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [lignes, setLignes] = useState<Record<number, LigneCommande[]>>({})
  const [loading, setLoading] = useState(true)
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [rechCode, setRechCode] = useState('')
  // filtre principal : 'tous' | 'avec' | 'sans'
  const [filtreType, setFiltreType] = useState<'tous' | 'avec' | 'sans'>('tous')
  // sous-filtre statut (dépend du type)
  const [filtreStatut, setFiltreStatut] = useState('tous')

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const [cmds, livs] = await Promise.all([
        fournisseurApi.commandes(fid, corbeille),
        fournisseurApi.livreurs(fid),
      ])
      const arr = Array.isArray(cmds) ? cmds : []
      arr.sort((a, b) => b.date_commande.localeCompare(a.date_commande))
      setCommandes(arr)
      setLivreurs(Array.isArray(livs) ? livs : [])
      const map: Record<number, LigneCommande[]> = {}
      await Promise.all(arr.map(async (c) => { map[c.id] = await fournisseurApi.produitsCommande(c.id).catch(() => []) }))
      setLignes(map)
    } finally { setLoading(false) }
  }, [fid, corbeille])

  useEffect(() => { charger() }, [charger])

  // quand on change le type, on remet le sous-filtre à zéro
  const changerType = (t: 'tous' | 'avec' | 'sans') => { setFiltreType(t); setFiltreStatut('tous') }

  const filtrees = commandes.filter((c) => {
    // type livraison
    if (filtreType === 'avec' && !c.avec_livraison) return false
    if (filtreType === 'sans' && c.avec_livraison) return false
    // sous-filtre statut
    if (filtreStatut !== 'tous' && c.statut !== filtreStatut) return false
    // recherche par code
    if (rechCode.trim() && !(c.code_confirmation || '').includes(rechCode.trim())) return false
    // période
    if (du || au) {
      const d = c.date_commande.slice(0, 10)
      if (du && d < du) return false
      if (au && d > au) return false
    }
    return true
  })

  // total = commandes terminées (livrée OU récupérée)
  const totalTermine = filtrees.filter((c) => estTerminee(c.statut)).reduce((s, c) => s + Number(c.prix_total), 0)

  if (loading) return <Spinner label="Chargement des commandes…" />

  // sous-filtres selon le type choisi
  const sousFiltres: [string, string][] =
    filtreType === 'avec' ? [['tous', 'Toutes'], ['en_attente', 'En attente'], ['en_route', 'En route'], ['livre', 'Livrées']]
    : filtreType === 'sans' ? [['tous', 'Toutes'], ['non_recupere', 'À récupérer'], ['recupere', 'Récupérées']]
    : []

  return (
    <div>
      {/* Onglets commandes / corbeille */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setCorbeille(false)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!corbeille ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>📦 Commandes</button>
        <button onClick={() => setCorbeille(true)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${corbeille ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>🗑️ Corbeille</button>
      </div>

      {!corbeille && (
        <>
          {/* Filtre période + total */}
          <div className="bg-white rounded-2xl border border-stone-100 p-3 mb-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Période</span>
            <input type="date" value={du} onChange={(e) => setDu(e.target.value)} className="text-sm border border-stone-200 rounded-lg px-2 py-1" />
            <span className="text-stone-300">→</span>
            <input type="date" value={au} onChange={(e) => setAu(e.target.value)} className="text-sm border border-stone-200 rounded-lg px-2 py-1" />
            {(du || au) && <button onClick={() => { setDu(''); setAu('') }} className="text-xs text-stone-400 hover:text-red-500">✕</button>}
            <span className="ml-auto text-sm font-bold text-emerald-600">Prix total : {fmtDA(totalTermine)}</span>
          </div>

          {/* Recherche par code */}
          <div className="relative mb-3">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">🔍</span>
            <input type="text" inputMode="numeric" value={rechCode} onChange={(e) => setRechCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Chercher par code de commande…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            {rechCode && <button onClick={() => setRechCode('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">✕</button>}
          </div>

          {/* Filtre principal : type */}
          <div className="flex gap-2 mb-2">
            {([['tous', '📋 Toutes'], ['avec', '🛵 Avec livraison'], ['sans', '🏪 Sans livraison']] as [string, string][]).map(([k, label]) => (
              <button key={k} onClick={() => changerType(k as any)}
                className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${filtreType === k ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-stone-500 border border-stone-200'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Sous-filtres statut (selon type) */}
          {sousFiltres.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pl-1">
              {sousFiltres.map(([k, label]) => (
                <button key={k} onClick={() => setFiltreStatut(k)}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${filtreStatut === k ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {filtrees.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">{corbeille ? '🗑️' : '📭'}</p>
          <p>{corbeille ? 'Corbeille vide' : 'Aucune commande'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrees.map((c) => (
            <CommandeCard key={c.id} c={c} lignes={lignes[c.id] || []} livreurs={livreurs} corbeille={corbeille} session={undefined} onChange={charger} />
          ))}
        </div>
      )}
    </div>
  )
}

function CommandeCard({ c, lignes, livreurs, corbeille, onChange }: {
  c: Commande; lignes: LigneCommande[]; livreurs: Livreur[]; corbeille: boolean; session?: any; onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [selLivreur, setSelLivreur] = useState<number>(c.livreur_id || (livreurs[0]?.id ?? 0))
  const [showMap, setShowMap] = useState(false)
  const st = statutInfo(c.statut)

  const act = async (fn: () => Promise<any>) => { setBusy(true); try { await fn() } finally { setBusy(false); onChange() } }

  const imprimer = () => {
    const prix = window.prompt('Prix de livraison à ajouter sur le reçu (DA) — laisser vide si aucun :', '')
    const fraisLiv = prix && prix.trim() ? Number(prix) : 0
    const sousTotal = Number(c.prix_total)
    const totalFinal = sousTotal + fraisLiv
    const nomCommerce = (c as any).commerce_nom || 'Mon Commerce'
    const rows = lignes.map((l) => `<tr><td>${l.quantite}</td><td>${l.nom}</td><td style="text-align:right">${fmtDA(Number(l.prix_unitaire) * l.quantite)}</td></tr>`).join('')
    const fraisRow = fraisLiv > 0 ? `<tr><td colspan="2">Livraison</td><td style="text-align:right">${fmtDA(fraisLiv)}</td></tr>` : ''
    const w = window.open('', '_blank', 'width=320,height=640')
    if (!w) return
    w.document.write(`
      <html><head><title>Reçu #${c.code_confirmation || c.id}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;padding:12px;font-size:12px;color:#000;width:280px}
        h1{font-size:18px;text-align:center;font-weight:bold;letter-spacing:1px;margin-bottom:4px}
        .center{text-align:center}
        .muted{color:#333;font-size:11px}
        hr{border:none;border-top:1px dashed #000;margin:8px 0}
        table{width:100%;border-collapse:collapse}
        th,td{padding:2px 0;font-size:11px;vertical-align:top}
        thead th{border-bottom:1px solid #000;text-align:left;font-size:10px;text-transform:uppercase}
        thead th:last-child{text-align:right}
        .tot{font-weight:bold;font-size:13px;border-top:1px dashed #000}
        .tot td{padding-top:6px}
        .thanks{text-align:center;font-style:italic;margin-top:10px;font-size:11px}
      </style></head><body>
        <h1>${nomCommerce.toUpperCase()}</h1>
        <p class="center muted">${(c as any).commerce_adresse || ''}</p>
        <p class="center muted">${(c as any).commerce_tel ? 'Tél : ' + (c as any).commerce_tel : ''}</p>
        <hr>
        <p class="muted">Ticket : ${c.code_confirmation || c.id}</p>
        <p class="muted">Le ${fmtDateHeure(c.date_commande)}</p>
        <p class="muted">Client : ${c.acheteur_nom || 'Client'}${c.acheteur_telephone ? ' — ' + c.acheteur_telephone : ''}</p>
        <p class="muted">${c.avec_livraison ? '🛵 Avec livraison' : '🏪 À récupérer'}</p>
        <hr>
        <table>
          <thead><tr><th>Qté</th><th>Produit</th><th>Prix</th></tr></thead>
          <tbody>
            ${rows}
            <tr><td colspan="2" style="padding-top:6px">Sous-total</td><td style="text-align:right;padding-top:6px">${fmtDA(sousTotal)}</td></tr>
            ${fraisRow}
          </tbody>
        </table>
        <table><tr class="tot"><td colspan="2">TOTAL FACTURE</td><td style="text-align:right">${fmtDA(totalFinal)}</td></tr>
        <tr class="tot"><td colspan="2">RESTE À PAYER</td><td style="text-align:right">${fmtDA(totalFinal)}</td></tr></table>
        <hr>
        <p class="center muted">💵 Paiement en espèces</p>
        <p class="thanks">Merci cher client — À très bientôt !</p>
        <script>window.print()</script>
      </body></html>`)
    w.document.close()
  }

  // options de statut selon le type de commande
  const optionsStatut = c.avec_livraison
    ? [['en_attente', 'En attente'], ['en_route', 'En route'], ['livre', 'Livrée']]
    : [['non_recupere', 'À récupérer'], ['recupere', 'Récupérée']]

  // valeur affichée dans le select (si statut incohérent avec le type, on met la 1re option)
  const statutCourant = optionsStatut.some(([k]) => k === c.statut) ? c.statut : optionsStatut[0][0]

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs text-stone-400">🕐 {fmtDateHeure(c.date_commande)}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.avec_livraison ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-500'}`}>
                {c.avec_livraison ? '🛵 Avec livraison' : '🏪 À récupérer'}
              </span>
            </div>
          </div>
          <span className="text-lg font-extrabold text-emerald-600 whitespace-nowrap">💰 {fmtDA(c.prix_total)}</span>
        </div>

        {/* Client + code */}
        <div className="flex items-center justify-between gap-2 mb-2 text-sm">
          <div className="min-w-0">
            <span className="font-semibold text-stone-700">👤 {c.acheteur_nom || 'Client'}</span>
            {c.acheteur_telephone && <a href={`tel:${c.acheteur_telephone}`} className="text-blue-600 ml-2 hover:underline">📞 {c.acheteur_telephone}</a>}
          </div>
          {c.code_confirmation && <span className="shrink-0 text-xs font-mono font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">#{c.code_confirmation}</span>}
        </div>

        {/* Produits */}
        <div className="bg-stone-50 rounded-xl p-3 text-sm space-y-1 mb-3">
          {lignes.length === 0 ? <p className="text-stone-400 text-xs">…</p> :
            lignes.map((l, i) => (
              <div key={i} className="flex justify-between text-stone-600">
                <span>{l.quantite}× {l.nom}</span>
                <span className="text-stone-400">{fmtDA(Number(l.prix_unitaire) * l.quantite)}</span>
              </div>
            ))}
        </div>

        {corbeille ? (
          <button disabled={busy} onClick={() => act(() => fournisseurApi.restaurerCommande(c.id))}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
            ♻️ Restaurer
          </button>
        ) : (
          <div className="space-y-2">
            {c.avec_livraison && (
              <div className="flex items-center gap-2">
                <select value={selLivreur} onChange={(e) => setSelLivreur(Number(e.target.value))}
                  className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white">
                  {livreurs.length === 0 ? <option value={0}>Aucun livreur</option> :
                    livreurs.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
                </select>
                <button disabled={busy || !selLivreur} onClick={() => act(() => fournisseurApi.assignerLivreur(c.id, selLivreur))}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap">
                  {c.livreur_id ? 'Changer' : 'Assigner'}
                </button>
              </div>
            )}
            {c.livreur_nom && <p className="text-xs text-stone-500">Livreur : <b>{c.livreur_nom}</b></p>}
            {c.avec_livraison && c.acheteur_latitude != null && c.acheteur_longitude != null && (
              <div>
                <button onClick={() => setShowMap((v) => !v)}
                  className="flex items-center justify-center gap-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold py-2 rounded-xl transition-all">
                  📍 {showMap ? 'Masquer la carte' : 'Voir la localisation du client'}
                </button>
                {showMap && (
                  <div className="mt-2">
                    <MapView lat={c.acheteur_latitude} lng={c.acheteur_longitude} />
                    <a href={`https://www.google.com/maps?q=${c.acheteur_latitude},${c.acheteur_longitude}`} target="_blank" rel="noopener"
                      className="block text-center text-xs text-blue-600 hover:underline mt-1.5">Ouvrir dans Google Maps (itinéraire) →</a>
                  </div>
                )}
              </div>
            )}
            {c.avec_livraison && c.acheteur_latitude == null && (
              <p className="text-[11px] text-stone-400 text-center">📍 Localisation non partagée par le client</p>
            )}

            <div className="flex items-center gap-2">
              <select value={statutCourant} onChange={(e) => act(() => fournisseurApi.changerStatut(c.id, e.target.value))}
                className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white">
                {optionsStatut.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
              <button onClick={imprimer} className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap">🖨️ Reçu</button>
            </div>

            <button disabled={busy} onClick={() => act(() => fournisseurApi.supprimerCommande(c.id))}
              className="w-full text-red-500 hover:bg-red-50 text-sm font-semibold py-2 rounded-xl transition-all">
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProduitsTab({ fid }: { fid: number }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [categorie, setCategorie] = useState(CATEGORIES_PRODUITS[0])
  const [ingredients, setIngredients] = useState('')
  const [filtreCat, setFiltreCat] = useState('Tous')
  const [magasinImg, setMagasinImg] = useState<string | null>(null)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const [prods, infos] = await Promise.all([
        fournisseurApi.produits(fid),
        fournisseurApi.getInfos(fid).catch(() => null),
      ])
      setProduits(Array.isArray(prods) ? prods : [])
      if (infos && infos.image_url) setMagasinImg(imgUrl(infos.image_url) + '?t=' + Date.now())
    } finally { setLoading(false) }
  }, [fid])

  useEffect(() => { charger() }, [charger])

  const ajouter = async () => {
    if (!nom.trim() || !prix) return
    await fournisseurApi.ajouterProduit({ fournisseur_id: fid, nom: nom.trim(), prix: Number(prix), categorie, ingredients: ingredients.trim() || undefined, disponible: true })
    setNom(''); setPrix(''); setIngredients(''); charger()
  }

  const uploadMagasin = async (file: File) => {
    const r = await fournisseurApi.uploadImageMagasin(fid, file)
    if (r.image_url) setMagasinImg(imgUrl(r.image_url) + '?t=' + Date.now())
  }

  // grouper par catégorie
  const groupes: Record<string, Produit[]> = {}
  produits.forEach((p) => { const c = p.categorie || 'Autre'; (groupes[c] = groupes[c] || []).push(p) })

  if (loading) return <Spinner label="Chargement du menu…" />

  return (
    <div className="space-y-5">
      {/* Photo magasin */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4">
        <p className="text-sm font-bold text-stone-700 mb-3">🏪 Photo de mon commerce</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
            {magasinImg ? <img src={magasinImg} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-40">🏪</span>}
          </div>
          <label className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all">
            📷 Changer la photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMagasin(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* Ajouter produit */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4">
        <p className="text-sm font-bold text-stone-700 mb-3">➕ Ajouter un produit</p>
        <div className="flex flex-wrap gap-2">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du produit" className="flex-1 min-w-[140px] text-sm border border-stone-200 rounded-xl px-3 py-2.5" />
          <input value={prix} onChange={(e) => setPrix(e.target.value)} type="number" placeholder="Prix DA" className="w-24 text-sm border border-stone-200 rounded-xl px-3 py-2.5" />
          <input list="cats-produits" value={categorie} onChange={(e) => setCategorie(e.target.value)}
            placeholder="Type (Pizza, Tacos…)" className="w-36 text-sm border border-stone-200 rounded-xl px-3 py-2.5 bg-white" />
          <datalist id="cats-produits">
            {CATEGORIES_PRODUITS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <button onClick={ajouter} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">Ajouter</button>
        </div>
        <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingrédients (optionnel) : ex. Pâte, tomate, mozzarella…"
          className="w-full mt-2 text-sm border border-stone-200 rounded-xl px-3 py-2.5" />
      </div>

      {/* Filtre par type de produit */}
      {produits.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['Tous', ...Object.keys(groupes).sort()].map((c) => (
            <button key={c} onClick={() => setFiltreCat(c)}
              className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${filtreCat === c ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>
              {c === 'Tous' ? 'Tous' : `${catEmoji(c)} ${c}`}
            </button>
          ))}
        </div>
      )}

      {/* Liste produits groupée */}
      {produits.length === 0 ? (
        <p className="text-center text-stone-400 py-8">Aucun produit pour l'instant</p>
      ) : (
        Object.keys(groupes).sort().filter((cat) => filtreCat === 'Tous' || cat === filtreCat).map((cat) => (
          <div key={cat}>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 mt-1">{catEmoji(cat)} {cat}</p>
            <div className="space-y-3">
              {groupes[cat].map((p) => <ProduitRow key={p.id} p={p} onChange={charger} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function ProduitRow({ p, onChange }: { p: Produit; onChange: () => void }) {
  const [editing, setEditing] = useState(false)
  const [nom, setNom] = useState(p.nom)
  const [prix, setPrix] = useState(String(p.prix))
  const [prixPromo, setPrixPromo] = useState(p.prix_promo != null ? String(p.prix_promo) : '')
  const [categorie, setCategorie] = useState(p.categorie || 'Autre')
  const [ingredients, setIngredients] = useState(p.ingredients || '')
  const [img, setImg] = useState<string | null>(imgUrl(p.image_url))

  const sauver = async () => {
    const payload: any = { nom, prix: Number(prix), categorie, ingredients }
    if (prixPromo.trim() === '') payload.retirer_promo = true
    else payload.prix_promo = Number(prixPromo)
    await fournisseurApi.modifierProduit(p.id, payload); setEditing(false); onChange()
  }
  const toggleDispo = async () => { await fournisseurApi.modifierProduit(p.id, { disponible: !p.disponible }); onChange() }
  const supprimer = async () => { if (confirm(`Supprimer "${p.nom}" ?`)) { await fournisseurApi.supprimerProduit(p.id); onChange() } }
  const upload = async (file: File) => { const r = await fournisseurApi.uploadImageProduit(p.id, file); if (r.image_url) setImg(imgUrl(r.image_url) + '?t=' + Date.now()) }

  return (
    <div className={`bg-white rounded-2xl border border-stone-100 p-3 flex items-center gap-3 ${!p.disponible ? 'opacity-60' : ''}`}>
      <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
        {img ? <img src={img} className="w-full h-full object-cover" /> : <span className="text-xl opacity-40">🍽️</span>}
      </div>
      {editing ? (
        <div className="flex-1 flex flex-wrap gap-2">
          <input value={nom} onChange={(e) => setNom(e.target.value)} className="flex-1 min-w-[100px] text-sm border border-stone-200 rounded-lg px-2 py-1.5" />
          <input value={prix} onChange={(e) => setPrix(e.target.value)} type="number" placeholder="Prix" className="w-20 text-sm border border-stone-200 rounded-lg px-2 py-1.5" />
          <input value={prixPromo} onChange={(e) => setPrixPromo(e.target.value)} type="number" placeholder="Promo" className="w-20 text-sm border border-pink-200 bg-pink-50 rounded-lg px-2 py-1.5" title="Prix promo (laisser vide = pas de promo)" />
          <input list="cats-produits-edit" value={categorie} onChange={(e) => setCategorie(e.target.value)}
            placeholder="Type" className="w-24 text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-white" />
          <datalist id="cats-produits-edit">
            {CATEGORIES_PRODUITS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingrédients…" className="w-full text-sm border border-stone-200 rounded-lg px-2 py-1.5" />
          <button onClick={sauver} className="bg-emerald-500 text-white px-3 rounded-lg flex items-center"><Check size={16} /></button>
          <button onClick={() => setEditing(false)} className="bg-stone-200 text-stone-600 px-3 rounded-lg flex items-center"><X size={16} /></button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-800 text-sm truncate">{p.nom}
              {p.prix_promo != null && <span className="ml-1.5 text-[10px] bg-pink-100 text-pink-600 font-bold px-1.5 py-0.5 rounded-full align-middle">PROMO</span>}
            </p>
            {p.prix_promo != null
              ? <p className="text-sm"><span className="text-pink-600 font-bold">{fmtDA(p.prix_promo)}</span> <span className="text-stone-400 line-through text-xs">{fmtDA(p.prix)}</span></p>
              : <p className="text-amber-600 font-bold text-sm">{fmtDA(p.prix)}</p>}
            {p.ingredients && <p className="text-[11px] text-stone-400 truncate">🧾 {p.ingredients}</p>}
            {!p.disponible && <span className="text-[10px] text-red-400 font-semibold">Indisponible</span>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <label className="bg-stone-100 hover:bg-stone-200 text-stone-600 p-2 rounded-lg cursor-pointer transition-colors flex items-center"><Camera size={15} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            <button onClick={toggleDispo} className="bg-stone-100 hover:bg-stone-200 text-stone-600 p-2 rounded-lg transition-colors flex items-center">{p.disponible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
            <button onClick={() => setEditing(true)} className="bg-stone-100 hover:bg-stone-200 text-stone-600 p-2 rounded-lg transition-colors flex items-center"><Pencil size={15} /></button>
            <button onClick={supprimer} className="bg-red-50 hover:bg-red-100 text-red-500 p-2 rounded-lg transition-colors flex items-center"><Trash2 size={15} /></button>
          </div>
        </>
      )}
    </div>
  )
}

function LivreursTab({ fid }: { fid: number }) {
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')

  const charger = useCallback(async () => {
    setLoading(true)
    try { const l = await fournisseurApi.livreurs(fid); setLivreurs(Array.isArray(l) ? l : []) } finally { setLoading(false) }
  }, [fid])
  useEffect(() => { charger() }, [charger])

  const ajouter = async () => { if (!nom.trim()) return; await fournisseurApi.ajouterLivreur({ fournisseur_id: fid, nom: nom.trim(), telephone: tel.trim() || undefined }); setNom(''); setTel(''); charger() }
  const supprimer = async (id: number, n: string) => { if (confirm(`Supprimer le livreur "${n}" ?`)) { await fournisseurApi.supprimerLivreur(id); charger() } }

  if (loading) return <Spinner label="Chargement des livreurs…" />

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-stone-100 p-4">
        <p className="text-sm font-bold text-stone-700 mb-3">➕ Ajouter un livreur</p>
        <div className="flex flex-wrap gap-2">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du livreur" className="flex-1 min-w-[120px] text-sm border border-stone-200 rounded-xl px-3 py-2.5" />
          <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Téléphone (optionnel)" className="flex-1 min-w-[120px] text-sm border border-stone-200 rounded-xl px-3 py-2.5" />
          <button onClick={ajouter} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">Ajouter</button>
        </div>
      </div>
      {livreurs.length === 0 ? (
        <p className="text-center text-stone-400 py-8">Aucun livreur</p>
      ) : (
        <div className="space-y-2">
          {livreurs.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-stone-100 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">🛵</div>
              <div className="flex-1"><p className="font-semibold text-stone-800 text-sm">{l.nom}</p>{l.telephone && <p className="text-xs text-stone-400">{l.telephone}</p>}</div>
              <button onClick={() => supprimer(l.id, l.nom)} className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-2 rounded-lg transition-colors">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AVIS ─────────────────────────────────────────────────────────────────────

function AvisTab({ fid }: { fid: number }) {
  const [note, setNote] = useState<{ moyenne: number; nombre: number }>({ moyenne: 0, nombre: 0 })
  const [evals, setEvals] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const [n, e] = await Promise.all([fournisseurApi.note(fid), fournisseurApi.evaluations(fid)])
      setNote(n); setEvals(Array.isArray(e) ? e : [])
    } finally { setLoading(false) }
  }, [fid])

  useEffect(() => { charger() }, [charger])

  const supprimer = async (eid?: number) => {
    if (!eid) return
    if (!confirm('Supprimer cet avis ?')) return
    await fournisseurApi.supprimerAvis(eid); charger()
  }

  if (loading) return <Spinner label="Chargement des avis…" />

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-stone-100 p-5 text-center">
        <p className="text-4xl font-extrabold text-stone-800">{note.moyenne || '—'}</p>
        <StarRating note={Math.round(note.moyenne)} size="lg" />
        <p className="text-sm text-stone-400 mt-1">{note.nombre} avis</p>
      </div>
      {evals.length === 0 ? (
        <p className="text-center text-stone-400 py-8">Aucun avis pour l'instant</p>
      ) : (
        <div className="space-y-3">
          {evals.map((e, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-stone-700 text-sm">{e.nom}</span>
                <div className="flex items-center gap-2">
                  <StarRating note={e.note} />
                  {e.id && <button onClick={() => supprimer(e.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2 py-1 rounded-lg transition-colors">🗑️</button>}
                </div>
              </div>
              {e.commentaire && <p className="text-sm text-stone-500">{e.commentaire}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── INFOS (Mon commerce) ──────────────────────────────────────────────────────

const CATEGORIES_MAGASIN = ['Food', 'Fast Food', 'Viennoiserie', 'Boulangerie', 'Épicerie', 'Parfum', 'Cosmétique', 'Autre']

function InfosTab({ session }: { session: FournisseurSession }) {
  const [nom, setNom] = useState(session.nom || '')
  const [categorie, setCategorie] = useState(session.categorie || '')
  const [adresse, setAdresse] = useState(session.adresse || '')
  const [telephone, setTelephone] = useState(session.telephone || '')
  const [ouverture, setOuverture] = useState((session.heure_ouverture || '').slice(0, 5))
  const [fermeture, setFermeture] = useState((session.heure_fermeture || '').slice(0, 5))
  const [presentation, setPresentation] = useState(session.presentation || '')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    session.latitude != null && session.longitude != null ? { lat: session.latitude, lng: session.longitude } : null
  )
  const [livraisonGratuite, setLivraisonGratuite] = useState(!!session.livraison_gratuite)
  const [fraisMin, setFraisMin] = useState(session.frais_min != null ? String(session.frais_min) : '')
  const [fraisMax, setFraisMax] = useState(session.frais_max != null ? String(session.frais_max) : '')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const sauver = async () => {
    setSaving(true); setError(''); setDone(false)
    try {
      const payloadFrais = livraisonGratuite
        ? {}
        : {
            frais_min: fraisMin !== '' ? Number(fraisMin) : undefined,
            frais_max: fraisMax !== '' ? Number(fraisMax) : undefined,
          }
      await fournisseurApi.modifierInfos(session.id, {
        nom, categorie, adresse, telephone,
        latitude: position?.lat, longitude: position?.lng,
        heure_ouverture: ouverture, heure_fermeture: fermeture,
        presentation,
        livraison_gratuite: livraisonGratuite,
        ...payloadFrais,
      })
      // mettre à jour la session stockée
      const s = { ...session, nom, categorie, adresse, telephone, latitude: position?.lat, longitude: position?.lng, heure_ouverture: ouverture, heure_fermeture: fermeture, presentation, livraison_gratuite: livraisonGratuite, frais_min: fraisMin ? Number(fraisMin) : null, frais_max: fraisMax ? Number(fraisMax) : null }
      localStorage.setItem('fournisseur', JSON.stringify(s))
      setDone(true)
      setTimeout(() => location.reload(), 800)
    } catch { setError('Échec de l\'enregistrement.') } finally { setSaving(false) }
  }

  const inputCls = 'w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all'
  const labelCls = 'block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5'

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
        <p className="text-sm font-bold text-stone-700">🏪 Informations de mon commerce</p>
        <p className="text-xs text-stone-400 -mt-2">Ces infos sont visibles par les clients.</p>

        <div>
          <label className={labelCls}>Nom du commerce</label>
          <input className={inputCls} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de mon commerce" />
        </div>
        <div>
          <label className={labelCls}>Catégorie / Profession</label>
          <input list="cats-magasin" className={inputCls} value={categorie} onChange={(e) => setCategorie(e.target.value)} placeholder="Viennoiserie, Fast Food…" />
          <datalist id="cats-magasin">
            {CATEGORIES_MAGASIN.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input className={inputCls} type="tel" inputMode="numeric" value={telephone}
            onChange={(e) => setTelephone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="05 XX XX XX XX" />
        </div>
        <div>
          <label className={labelCls}>Adresse</label>
          <input className={inputCls} value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Rue, ville" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Ouverture</label>
            <input className={inputCls} type="time" value={ouverture} onChange={(e) => setOuverture(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Fermeture</label>
            <input className={inputCls} type="time" value={fermeture} onChange={(e) => setFermeture(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>✨ Pourquoi nous choisir ? (présentation)</label>
          <textarea className={inputCls + ' resize-none'} rows={5} value={presentation}
            onChange={(e) => setPresentation(e.target.value)}
            placeholder="Présentez votre commerce : votre histoire, vos spécialités, ce qui vous rend unique, vos garanties…" />
          <p className="text-[11px] text-stone-400 mt-1">Ce texte sera visible par les clients sur votre page.</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-sm font-bold text-stone-700 mb-3">🛵 Livraison</p>
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={livraisonGratuite} onChange={(e) => setLivraisonGratuite(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
            <span className="text-sm text-stone-700 font-medium">Livraison gratuite</span>
          </label>
          {!livraisonGratuite && (
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-[11px] text-stone-400">Frais min (DA)</label>
                <input value={fraisMin} onChange={(e) => setFraisMin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="100" className={inputCls} />
              </div>
              <span className="text-stone-300 mt-4">—</span>
              <div className="flex-1">
                <label className="text-[11px] text-stone-400">Frais max (DA)</label>
                <input value={fraisMax} onChange={(e) => setFraisMax(e.target.value.replace(/[^0-9]/g, ''))} placeholder="200" className={inputCls} />
              </div>
            </div>
          )}
          <p className="text-[11px] text-stone-400 mt-2">Le temps de livraison est calculé automatiquement selon la distance (moto).</p>
        </div>

        <div>
          <label className={labelCls}>📍 Localisation de mon commerce</label>
          <p className="text-[11px] text-stone-400 mb-2">Placez le marqueur sur l'emplacement exact de votre commerce. Cela permet de calculer la distance avec les clients.</p>
          <MapPicker value={position} onChange={setPosition} />
          {position && <p className="text-[11px] text-emerald-600 mt-1.5 font-semibold">✓ Position enregistrée</p>}
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3">{error}</div>}
        {done && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-2xl px-4 py-3">✓ Informations enregistrées</div>}

        <button onClick={sauver} disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60 shadow-lg shadow-amber-500/30">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <ReclamationFournisseur session={session} />
    </div>
  )
}

function ReclamationFournisseur({ session }: { session: FournisseurSession }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const envoyer = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await reclamationApi.envoyer({
        type_auteur: 'fournisseur', auteur_id: session.id,
        auteur_nom: session.nom, auteur_telephone: session.telephone,
        message: message.trim(),
      })
      setSent(true); setMessage('')
    } catch {} finally { setSending(false) }
  }
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
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
    </div>
  )
}


// ─── Statistiques du commerce ───────────────────────────────────────────────
function StatsTab({ fid }: { fid: number }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('tout')

  useEffect(() => {
    setLoading(true)
    fournisseurApi.statistiques(fid, periode)
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [fid, periode])

  const periodes: [string, string][] = [
    ['jour', "Aujourd'hui"], ['semaine', '7 jours'], ['mois', '30 jours'], ['tout', 'Tout'],
  ]

  return (
    <div className="space-y-5">
      {/* Filtre période */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {periodes.map(([k, label]) => (
          <button key={k} onClick={() => setPeriode(k)}
            className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${periode === k ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <Spinner label="Chargement des statistiques…" /> : !stats ? (
        <p className="text-center text-stone-400 py-10">Aucune donnée disponible.</p>
      ) : (
        <>
          {/* Cartes principales */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Commandes" valeur={String(stats.nb_commandes)} sous={`${stats.nb_terminees} livrées`} accent="bg-blue-50 text-blue-600" />
            <StatCard label="Chiffre d'affaires" valeur={fmtDA(stats.chiffre_affaires)} sous="commandes livrées" accent="bg-emerald-50 text-emerald-600" />
            <StatCard label="Panier moyen" valeur={fmtDA(stats.panier_moyen)} sous="par commande livrée" accent="bg-amber-50 text-amber-600" />
            <StatCard label="Note moyenne" valeur={stats.note_moyenne != null ? `★ ${stats.note_moyenne}` : '—'} sous={`${stats.nb_avis} avis`} accent="bg-yellow-50 text-yellow-600" />
            <StatCard label="Produits" valeur={String(stats.nb_produits)} sous={`${stats.nb_promos} en promo`} accent="bg-purple-50 text-purple-600" />
            <StatCard label="En promo" valeur={String(stats.nb_promos)} sous="produits réduits" accent="bg-pink-50 text-pink-600" />
          </div>

          {/* Répartition par statut */}
          {stats.par_statut && Object.keys(stats.par_statut).length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="text-sm font-bold text-stone-700 mb-3">Commandes par statut</p>
              <div className="space-y-2">
                {Object.entries(stats.par_statut).map(([statut, nb]) => (
                  <div key={statut} className="flex items-center justify-between text-sm">
                    <span className="text-stone-500 capitalize">{statut}</span>
                    <span className="font-bold text-stone-800">{String(nb)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-stone-400 text-center">Les vues et clics seront disponibles prochainement.</p>
        </>
      )}
    </div>
  )
}

function StatCard({ label, valeur, sous, accent }: { label: string; valeur: string; sous?: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${accent}`}>{label}</div>
      <p className="text-2xl font-extrabold text-stone-800 leading-none">{valeur}</p>
      {sous && <p className="text-[11px] text-stone-400 mt-1">{sous}</p>}
    </div>
  )
}
