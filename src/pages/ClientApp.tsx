'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Search, MapPin, Clock, Bike, Flame, User, Phone, Map as MapIcon, Navigation, ChevronDown, Store, Utensils, ReceiptText, History, Star, Package } from 'lucide-react'
import { clientApi } from '@/lib/api'
import type { Fournisseur, Produit, Acheteur, Commande } from '@/lib/api'
import { CATEGORIES_CLIENT, catEmoji } from '@/lib/categories'

interface ClientAppProps {
  acheteur: Acheteur | null
  onLogout: () => void
}

export function ClientApp({ acheteur: initialAcheteur, onLogout }: ClientAppProps) {
  const [page, setPage] = useState<'stores' | 'store' | 'account' | 'orders' | 'reviews'>('stores')
  const [stores, setStores] = useState<Fournisseur[]>([])
  const [store, setStore] = useState<Fournisseur | null>(null)
  const [produits, setProduits] = useState<Produit[]>([])
  const [cart, setCart] = useState<{ produit: Produit; quantite: number }[]>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('orania_cart')
    return saved ? JSON.parse(saved) : []
  }
  return []
})
  const [acheteur, setAcheteur] = useState(initialAcheteur)
  const [loading, setLoading] = useState(true)
  const [orderCode, setOrderCode] = useState('')
  const [showSheet, setShowSheet] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtreCateg, setFiltreCateg] = useState('')
  const [filtrePromo, setFiltrePromo] = useState(false)
  const [livraisonGratuite, setLivraisonGratuite] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [livraison, setLivraison] = useState(true)
  const [orderRating, setOrderRating] = useState<number | null>(null)
  const [orderComment, setOrderComment] = useState('')
  const [showRatingSheet, setShowRatingSheet] = useState(false)
  const [ratingOrderId, setRatingOrderId] = useState<number | null>(null)
  const [storeReview, setStoreReview] = useState<any>(null)
  const [ordering, setOrdering] = useState(false)
  const [orders, setOrders] = useState<Commande[]>([])
  const [orderLoading, setOrderLoading] = useState(false)

  // Load stores
  useEffect(() => {
    const load = async () => {
      try {
        const s = await clientApi.stores()
        setStores(s || [])
      } catch (e) {
        console.error('Stores load error', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load orders when page changes to orders
  useEffect(() => {
    if (page === 'orders' && acheteur?.id) {
      const load = async () => {
        setOrderLoading(true)
        try {
          const o = await clientApi.historiqueCommandes(acheteur.id)
          setOrders(o || [])
        } catch (e) {
          console.error('Orders load error', e)
        } finally {
          setOrderLoading(false)
        }
      }
      load()
    }
  }, [page, acheteur?.id])

  // Filter function
  const quickMatch = (s: Fournisseur, key: string) => {
    if (key === 'promo') return s.a_promo === true
    if (!key) return true
    const normalizedKey = key.trim().toLowerCase()
    return (s.produits_categories || []).some((categorie) => 
      categorie.trim().toLowerCase() === normalizedKey
    )
  }

  // Filter stores
  const filteredStores = stores.filter((s) => {
    const searchMatch = s.nom.toLowerCase().includes(searchTerm.toLowerCase())
    const categMatch = !filtreCateg || quickMatch(s, filtreCateg)
    const promoMatch = !filtrePromo || s.a_promo
    const livraisonMatch = !livraisonGratuite || s.livraison_gratuite
    return searchMatch && categMatch && promoMatch && livraisonMatch
  })

  // Store functions
  const onStoreClick = async (s: Fournisseur) => {
    setStore(s)
    setPage('store')
    try {
      const prods = await clientApi.storeProduits(s.id)
      setProduits(prods || [])
      if (acheteur) {
        const review = await clientApi.monAvis(s.id, acheteur.id)
        setStoreReview(review)
      }
    } catch (e) {
      console.error('Store load error', e)
    }
  }

  const onBack = () => {
    setPage('stores')
    setStore(null)
    setProduits([])
  }

  // Cart functions
  const prixEff = (p: Produit) => Number(p.prix_promo != null ? p.prix_promo : p.prix)
  const totalItems = cart.reduce((s, i) => s + i.quantite, 0)
  const totalPrice = cart.reduce((s, i) => s + prixEff(i.produit) * i.quantite, 0)

  const addToCart = (p: Produit) => {
    const existing = cart.find((i) => i.produit.id === p.id)
    let newCart
    if (existing) {
      newCart = cart.map((i) => (i.produit.id === p.id ? { ...i, quantite: i.quantite + 1 } : i))
    } else {
      newCart = [...cart, { produit: p, quantite: 1 }]
    }
    setCart(newCart)
    localStorage.setItem('orania_cart', JSON.stringify(newCart))
  }

  const placeOrder = async () => {
    if (!acheteur || !acheteur.id) {
      alert('Lâchez-vous d\'abord!')
      return
    }
    if (cart.length === 0) {
      alert('Votre panier est vide!')
      return
    }
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
        acheteur_id: acheteur.id,
        fournisseur_id: store!.id,
        avec_livraison: livraison,
        ...pos,
        produits: cart.map((i) => ({ produit_id: i.produit.id, quantite: i.quantite })),
      })
      setOrderCode(cmd.code_confirmation || '------')
      setCart([])
      localStorage.removeItem('orania_cart')
    } catch (e) { 
      console.error('Order error', e)
      setOrderCode('------') 
    }
    setShowSheet(false)
    setOrdering(false)
  }

  const submitRating = async () => {
    if (!acheteur || !orderRating || !ratingOrderId || !store) return
    try {
      await clientApi.noterAvis({
        acheteur_id: acheteur.id,
        fournisseur_id: store.id,
        note: orderRating,
        commentaire: orderComment || undefined,
      })
      setOrderRating(null)
      setOrderComment('')
      setShowRatingSheet(false)
      setRatingOrderId(null)
      alert('Merci pour votre avis!')
    } catch (e) {
      console.error('Rating error', e)
    }
  }

  // Stores page
  if (page === 'stores' && !loading) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        {/* HEADER */}
        <div className="bg-white border-b border-stone-100 sticky top-0 z-10 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-extrabold text-stone-900 text-lg">Orania</h1>
              <p className="text-xs text-stone-500">Tout Oran, en un clic</p>
            </div>
            <button
              onClick={() => setPage('account')}
              className="w-10 h-10 rounded-xl bg-amber-100 hover:bg-amber-200 active:scale-95 transition-all flex items-center justify-center text-amber-600"
            >
              <User size={20} />
            </button>
          </div>

          {/* SEARCH */}
          <div className="flex gap-2">
            <div className="flex-1 bg-stone-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Search size={16} className="text-stone-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="pizza, thé, sushi..."
                className="bg-transparent text-sm w-full outline-none text-stone-900 placeholder-stone-400"
              />
            </div>
            <button className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-600">
              <Navigation size={18} />
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white px-4 py-3 border-b border-stone-100 sticky top-[80px] z-9 overflow-x-auto">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setLivraisonGratuite((v) => !v)}
              className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                livraisonGratuite ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              <Bike size={13} className="inline mr-1" />
              Livraison gratuite
            </button>

            <button
              onClick={() => setFiltrePromo((v) => !v)}
              className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                filtrePromo ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
              }`}
            >
              <Flame size={13} className="inline mr-1" />
              En promo
            </button>

            <button
              onClick={() => {
                setFiltreCateg('')
                setFiltrePromo(false)
                setLivraisonGratuite(false)
              }}
              className="shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* STORES */}
        <div className="px-4 py-4 space-y-3">
          {filteredStores.length === 0 ? (
            <div className="text-center py-10">
              <Store size={32} className="mx-auto mb-2 text-stone-300" />
              <p className="text-stone-500 text-sm">Aucun restaurant trouvé</p>
            </div>
          ) : (
            filteredStores.map((s) => (
              <button
                key={s.id}
                onClick={() => onStoreClick(s)}
                className="w-full text-left bg-white rounded-xl border border-stone-100 hover:border-stone-200 overflow-hidden active:scale-98 transition-all"
              >
                <img src={s.photo || '/placeholder.png'} alt={s.nom} className="w-full h-32 object-cover" />
                <div className="p-3 space-y-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-stone-900 text-sm">{s.nom}</h3>
                    {s.a_promo && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-semibold">🔥 Promo</span>}
                  </div>
                  <p className="text-xs text-stone-500">
                    {s.categorie || 'Restauration'} • {s.avis_count > 0 ? `${s.note_moyenne?.toFixed(1)} ⭐` : 'Nouveau'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-stone-600 pt-1 flex-wrap">
                    <Clock size={12} />
                    {s.temps_livraison} min
                    {s.livraison_gratuite && (
                      <>
                        <span>•</span>
                        <Bike size={12} />
                        Livraison gratuite
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Store menu page
  if (page === 'store' && store) {
    return (
      <div className="min-h-screen bg-stone-50 pb-24">
        {/* BANNER */}
        <div className="relative">
          <img src={store.photo || '/placeholder.png'} alt={store.nom} className="w-full h-40 object-cover" />
          <button
            onClick={onBack}
            className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/80 backdrop-blur hover:bg-white active:scale-95 transition-all flex items-center justify-center text-stone-900"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* STORE INFO */}
        <div className="px-4 py-3 bg-white border-b border-stone-100">
          <h2 className="font-extrabold text-stone-900 text-lg">{store.nom}</h2>
          <p className="text-xs text-stone-500 mt-1">
            {store.avis_count > 0 ? `${store.note_moyenne?.toFixed(1)} ⭐ • ${store.avis_count} avis` : 'Nouveau'}
          </p>
          <div className="flex items-center gap-2 text-xs text-stone-600 mt-2 pt-2 border-t border-stone-100 flex-wrap">
            <Clock size={14} />
            {store.temps_livraison} min
            {store.livraison_gratuite && (
              <>
                <span>•</span>
                <Bike size={14} />
                Livraison gratuite
              </>
            )}
          </div>
        </div>

        {/* CATEGORIES FILTER */}
        <div className="px-4 py-3 bg-white border-b border-stone-100 overflow-x-auto">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setFiltreCateg('')}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                !filtreCateg ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Tous
            </button>
            {CATEGORIES_CLIENT.map((c) => (
              <button
                key={c}
                onClick={() => setFiltreCateg(c)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  filtreCateg === c ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {catEmoji(c)} {c}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="px-4 py-4 space-y-3">
          {produits.filter((p) => !filtreCateg || p.categorie?.toLowerCase() === filtreCateg.toLowerCase()).length === 0 ? (
            <div className="text-center py-10 text-stone-500">
              <Package size={32} className="mx-auto mb-2 text-stone-300" />
              <p>Aucun produit</p>
            </div>
          ) : (
            produits
              .filter((p) => !filtreCateg || p.categorie?.toLowerCase() === filtreCateg.toLowerCase())
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full text-left bg-white rounded-xl p-3 border border-stone-100 hover:border-stone-200 active:scale-98 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-900 text-sm">{p.nom}</h4>
                      <p className="text-xs text-stone-500 mt-0.5">{catEmoji(p.categorie || '')} {p.categorie}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-amber-600">{prixEff(p)} DA</span>
                        {p.prix_promo && <span className="text-xs line-through text-stone-400">{p.prix} DA</span>}
                      </div>
                    </div>
                    {p.photo && <img src={p.photo} alt={p.nom} className="w-16 h-16 object-cover rounded-lg" />}
                  </div>
                </button>
              ))
          )}
        </div>

        {/* CART SHEET */}
        {showSheet && cart.length > 0 && (
          <div className="fixed inset-0 bg-black/30 z-40 flex items-end" onClick={() => setShowSheet(false)}>
            <div className="w-full bg-white rounded-t-2xl p-4 space-y-3 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-extrabold text-stone-900">Votre commande</h3>

              {/* CART ITEMS */}
              <div className="space-y-2 max-h-48 overflow-y-auto flex-1">
                {cart.map((item) => (
                  <div key={item.produit.id} className="flex justify-between items-center py-2 border-b border-stone-100">
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{item.produit.nom}</p>
                      <p className="text-xs text-stone-500">{prixEff(item.produit)} DA × {item.quantite}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newCart = cart.map((i) => (i.produit.id === item.produit.id ? { ...i, quantite: Math.max(0, i.quantite - 1) } : i)).filter((i) => i.quantite > 0)
                          setCart(newCart)
                          localStorage.setItem('orania_cart', JSON.stringify(newCart))
                        }}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantite}</span>
                      <button
                        onClick={() => {
                          const newCart = cart.map((i) => (i.produit.id === item.produit.id ? { ...i, quantite: i.quantite + 1 } : i))
                          setCart(newCart)
                          localStorage.setItem('orania_cart', JSON.stringify(newCart))
                        }}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DELIVERY */}
              <div className="py-3 border-t border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={livraison} onChange={(e) => setLivraison(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-semibold text-stone-900">Avec livraison (+{store.frais_min}-{store.frais_max} DA)</span>
                </label>
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-center py-3 border-t border-stone-200 font-bold text-stone-900">
                <span>Total</span>
                <span>{totalPrice + (livraison ? store.frais_min : 0)} DA</span>
              </div>

              {/* PLACE ORDER */}
              <button
                onClick={placeOrder}
                disabled={ordering}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
              >
                {ordering ? 'Traitement...' : '🚀 Commander'}
              </button>

              {orderCode && orderCode !== '------' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Commande confirmée!</p>
                  <p className="font-bold text-green-700 text-lg">{orderCode}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CART BUTTON */}
        {cart.length > 0 && !showSheet && (
          <button
            onClick={() => setShowSheet(true)}
            className="fixed bottom-4 left-4 right-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-between px-4 shadow-lg"
          >
            <span>Panier ({totalItems})</span>
            <span>{totalPrice} DA</span>
          </button>
        )}
      </div>
    )
  }

  // Account page
  if (page === 'account') {
    return (
      <div className="min-h-screen bg-stone-50 pb-10">
        {/* HEADER */}
        <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setPage('stores')} className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-extrabold text-stone-900">Mon compte</h2>
        </div>

        {/* ACCOUNT INFO */}
        {acheteur && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-2">
              <p className="text-xs text-stone-500 uppercase font-bold">Profil</p>
              <h3 className="font-bold text-stone-900">{acheteur.nom}</h3>
              <p className="text-sm text-stone-600">{acheteur.telephone}</p>
            </div>

            {/* TABS */}
            <div className="flex gap-2 border-b border-stone-100">
              <button
                onClick={() => setPage('orders')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                  page === 'orders' ? 'text-amber-600 border-amber-600' : 'text-stone-500 border-transparent hover:text-stone-600'
                }`}
              >
                <ReceiptText size={16} className="inline mr-1" />
                Commandes
              </button>
              <button
                onClick={() => setPage('reviews')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                  page === 'reviews' ? 'text-amber-600 border-amber-600' : 'text-stone-500 border-transparent hover:text-stone-600'
                }`}
              >
                <Star size={16} className="inline mr-1" />
                Avis
              </button>
            </div>
          </div>
        )}

        {/* LOGOUT */}
        <div className="px-4 pt-4">
          <button
            onClick={onLogout}
            className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold py-2 rounded-lg transition-all"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  // Orders page
  if (page === 'orders') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setPage('account')}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-extrabold text-stone-900">Commandes</h2>
        </div>

        <div className="px-4 py-4 space-y-3">
          {orderLoading ? (
            <p className="text-center text-stone-500">Chargement...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-stone-500">
              <History size={32} className="mx-auto mb-2 text-stone-300" />
              <p>Aucune commande</p>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl border border-stone-100 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-stone-900">Commande #{o.id}</h4>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">{o.statut}</span>
                </div>
                <p className="text-sm text-stone-600">{o.fournisseur_nom}</p>
                <p className="text-lg font-bold text-amber-600">{o.prix_total} DA</p>
                <button
                  onClick={() => {
                    setRatingOrderId(o.id)
                    setShowRatingSheet(true)
                  }}
                  className="w-full text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg font-semibold"
                >
                  ⭐ Évaluer
                </button>
              </div>
            ))
          )}
        </div>

        {/* RATING SHEET */}
        {showRatingSheet && (
          <div className="fixed inset-0 bg-black/30 z-40 flex items-end" onClick={() => setShowRatingSheet(false)}>
            <div className="w-full bg-white rounded-t-2xl p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-extrabold text-stone-900">Évaluer votre commande</h3>

              {/* STARS */}
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOrderRating(star)}
                    className="text-4xl transition-all hover:scale-110"
                  >
                    {star <= (orderRating || 0) ? '⭐' : '☆'}
                  </button>
                ))}
              </div>

              {/* COMMENT */}
              <textarea
                value={orderComment}
                onChange={(e) => setOrderComment(e.target.value)}
                placeholder="Commentaire (optionnel)"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
              />

              {/* SUBMIT */}
              <button
                onClick={submitRating}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg active:scale-95 transition-all"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Reviews page
  if (page === 'reviews') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setPage('account')}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center text-stone-700"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-extrabold text-stone-900">Mes avis</h2>
        </div>

        <div className="px-4 py-10 text-center text-stone-500">
          <Star size={32} className="mx-auto mb-2 text-stone-300" />
          <p>Vos avis apparaîtront ici</p>
        </div>
      </div>
    )
  }

  return null
}
