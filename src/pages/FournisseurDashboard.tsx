'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, Package, Bike, BarChart3, Store, Camera, Pencil,
  Trash2, Check, X, Plus, RefreshCw, Loader2, Flame
} from 'lucide-react'
import { fournisseurApi } from '@/lib/api'
import type { Produit, Commande, Livreur } from '@/lib/api'
import { CATEGORIES_PRODUITS, catEmoji, normalizeCategory } from '@/lib/categories'

interface FournisseurDashboardProps {
  session: { fournisseur_id: number; nom: string; telephone: string }
  onLogout: () => void
}

type Page = 'produits' | 'commandes' | 'stats' | 'infos'

const labels: Record<Page, string> = {
  produits: 'Produits', commandes: 'Commandes', stats: 'Stats', infos: 'Infos'
}

export function FournisseurDashboard({ session, onLogout }: FournisseurDashboardProps) {
  const [page, setPage] = useState<Page>('produits')
  const [produits, setProduits] = useState<Produit[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [prixPromo, setPrixPromo] = useState('')
  const [categorie, setCategorie] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [adding, setAdding] = useState(false)

  const [editingProduit, setEditingProduit] = useState<Produit | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [promoId, setPromoId] = useState<number | null>(null)
  const [promoValue, setPromoValue] = useState('')
  const [savingPromo, setSavingPromo] = useState(false)
  const [imageId, setImageId] = useState<number | null>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [updatingCommandeId, setUpdatingCommandeId] = useState<number | null>(null)

  const suggestions = useMemo(() => {
    const q = categorie.trim().toLowerCase()
    return q ? CATEGORIES_PRODUITS.filter(c => c.toLowerCase().includes(q)) : CATEGORIES_PRODUITS
  }, [categorie])

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    try {
      const [prod, cmd, liv, st] = await Promise.all([
        fournisseurApi.produits(session.fournisseur_id),
        fournisseurApi.commandes(session.fournisseur_id, false),
        fournisseurApi.livreurs(session.fournisseur_id),
        fournisseurApi.statistiques(session.fournisseur_id, 'tout')
      ])
      setProduits(prod || [])
      setCommandes(cmd || [])
      setLivreurs(liv || [])
      setStats(st || null)
    } catch (e) {
      console.error('Erreur chargement fournisseur:', e)
      alert('Impossible de charger les données du commerce.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [session.fournisseur_id])

  const resetForm = () => {
    setNom(''); setPrix(''); setPrixPromo(''); setCategorie(''); setShowSuggestions(false)
  }

  const addProduit = async () => {
    const n = nom.trim(), c = categorie.trim(), p = Number(prix)
    const promo = prixPromo.trim() ? Number(prixPromo) : undefined

    if (!n || !prix.trim() || !c) return alert('Veuillez remplir le nom, le prix et la catégorie.')
    if (!Number.isFinite(p) || p <= 0) return alert('Veuillez saisir un prix valide.')
    if (promo !== undefined && (!Number.isFinite(promo) || promo <= 0))
      return alert('Veuillez saisir un prix promo valide.')
    if (promo !== undefined && promo >= p)
      return alert('Le prix promo doit être inférieur au prix normal.')

    setAdding(true)
    try {
      await fournisseurApi.creerProduit({
        fournisseur_id: session.fournisseur_id,
        nom: n,
        prix: p,
        prix_promo: promo,
        categorie: normalizeCategory(c),
        disponible: true
      })
      const fresh = await fournisseurApi.produits(session.fournisseur_id)
      setProduits(fresh || [])
      resetForm()
      alert('Produit ajouté avec succès.')
    } catch (e) {
      console.error('Erreur création produit:', e)
      alert('Le produit n’a pas pu être ajouté. Vérifiez la connexion au serveur.')
    } finally {
      setAdding(false)
    }
  }

  const saveProduit = async () => {
    if (!editingProduit) return
    const n = editingProduit.nom.trim(), p = Number(editingProduit.prix)
    if (!n || !Number.isFinite(p) || p <= 0) return alert('Nom ou prix invalide.')

    setSavingEdit(true)
    try {
      await fournisseurApi.modifierProduit(editingProduit.id, {
        nom: n,
        prix: p,
        categorie: editingProduit.categorie
          ? normalizeCategory(editingProduit.categorie)
          : editingProduit.categorie
      })
      setProduits(await fournisseurApi.produits(session.fournisseur_id) || [])
      setEditingProduit(null)
    } catch (e) {
      console.error('Erreur modification:', e)
      alert('Impossible de modifier ce produit.')
    } finally { setSavingEdit(false) }
  }

  const deleteProduit = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return
    setDeletingId(id)
    try {
      await fournisseurApi.supprimerProduit(id)
      setProduits(current => current.filter(p => p.id !== id))
      if (promoId === id) { setPromoId(null); setPromoValue('') }
      if (imageId === id) setImageId(null)
    } catch (e) {
      console.error('Erreur suppression:', e)
      alert('Impossible de supprimer ce produit.')
    } finally { setDeletingId(null) }
  }

  const openPromo = (p: Produit) => {
    setPromoId(p.id)
    setPromoValue(p.prix_promo != null ? String(p.prix_promo) : '')
  }

  const updatePromo = async (id: number) => {
    const p = produits.find(x => x.id === id)
    const value = Number(promoValue)
    if (!p) return
    if (!promoValue.trim() || !Number.isFinite(value) || value <= 0)
      return alert('Veuillez saisir un prix promo valide.')
    if (value >= Number(p.prix))
      return alert('Le prix promo doit être inférieur au prix normal.')

    setSavingPromo(true)
    try {
      await fournisseurApi.modifierProduit(id, { prix_promo: value })
      setProduits(await fournisseurApi.produits(session.fournisseur_id) || [])
      setPromoId(null); setPromoValue('')
    } catch (e) {
      console.error('Erreur promo:', e)
      alert('Impossible de modifier la promotion.')
    } finally { setSavingPromo(false) }
  }

  const uploadImage = async (id: number, file: File) => {
    setUploadingId(id)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await fournisseurApi.uploadImage(id, fd)
      setProduits(await fournisseurApi.produits(session.fournisseur_id) || [])
      setImageId(null)
      alert('Image ajoutée avec succès.')
    } catch (e) {
      console.error('Erreur image:', e)
      alert('Impossible d’ajouter cette image.')
    } finally { setUploadingId(null) }
  }

  const changeCommandeStatut = async (id: number, statut: string) => {
    setUpdatingCommandeId(id)
    try {
      await fournisseurApi.changerStatut(id, statut)
      setCommandes(await fournisseurApi.commandes(session.fournisseur_id, false) || [])
    } catch (e) {
      console.error('Erreur statut:', e)
      alert('Impossible de modifier le statut de la commande.')
    } finally { setUpdatingCommandeId(null) }
  }

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-600">
        <Loader2 size={30} className="animate-spin" />
        <p className="font-medium">Chargement du commerce...</p>
      </div>
    </div>
  )

  const navItems: { key: Page; icon: typeof Package }[] = [
    { key: 'produits', icon: Package },
    { key: 'commandes', icon: Bike },
    { key: 'stats', icon: BarChart3 },
    { key: 'infos', icon: Store }
  ]

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button onClick={onLogout} className="flex min-w-0 items-center gap-2 rounded-xl text-left">
              <ArrowLeft size={20} className="shrink-0 text-stone-500" />
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold sm:text-lg">{session.nom}</p>
                <p className="text-xs text-stone-500">Espace fournisseur</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>

          <nav className="-mx-1 mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2 px-1">
              {navItems.map(({ key, icon: Icon }) => {
                const active = page === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPage(key)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      active ? 'bg-amber-500 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <Icon size={17} />
                    {labels[key]}
                    {key === 'commandes' && commandes.length > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-white'}`}>
                        {commandes.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        {page === 'produits' && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-xl font-extrabold">Ajouter un produit</h2>
              <p className="mt-1 text-sm text-stone-500">Ajoutez rapidement un article à votre catalogue.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du produit" disabled={adding}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100" />
                <input type="number" min="0" value={prix} onChange={e => setPrix(e.target.value)} placeholder="Prix (DA)" disabled={adding}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100" />
                <input type="number" min="0" value={prixPromo} onChange={e => setPrixPromo(e.target.value)} placeholder="Prix promo (facultatif)" disabled={adding}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100" />

                <div className="relative">
                  <input value={categorie} onChange={e => { setCategorie(e.target.value); setShowSuggestions(true) }}
                    onFocus={() => setShowSuggestions(true)} autoComplete="off" placeholder="Catégorie" disabled={adding}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100" />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl">
                      {suggestions.map(cat => (
                        <button key={cat} type="button" onMouseDown={e => e.preventDefault()}
                          onClick={() => { setCategorie(cat); setShowSuggestions(false) }}
                          className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-amber-50">
                          {catEmoji(cat)} {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="button" onClick={addProduit} disabled={adding}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
                {adding ? <><Loader2 size={18} className="animate-spin" /> Ajout en cours...</> : <><Plus size={19} /> Ajouter le produit</>}
              </button>
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-extrabold">Mes produits</h2>
                <p className="text-sm text-stone-500">{produits.length} produit{produits.length > 1 ? 's' : ''}</p>
              </div>

              {produits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-12 text-center">
                  <Package size={42} className="mx-auto mb-3 text-stone-300" />
                  <p className="font-bold text-stone-700">Aucun produit</p>
                  <p className="mt-1 text-sm text-stone-500">Ajoutez votre premier produit ci-dessus.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {produits.map(p => (
                    <article key={p.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                      {editingProduit?.id === p.id ? (
                        <div className="space-y-3 p-4">
                          <input value={editingProduit.nom}
                            onChange={e => setEditingProduit({ ...editingProduit, nom: e.target.value })}
                            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                          <input type="number" min="0" value={editingProduit.prix}
                            onChange={e => setEditingProduit({ ...editingProduit, prix: Number(e.target.value) })}
                            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                          <input value={editingProduit.categorie || ''}
                            onChange={e => setEditingProduit({ ...editingProduit, categorie: e.target.value })}
                            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={saveProduit} disabled={savingEdit}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-green-500 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                              {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Sauver
                            </button>
                            <button type="button" onClick={() => setEditingProduit(null)}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2.5 text-sm font-bold">
                              <X size={16} /> Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate font-extrabold">{p.nom}</h3>
                                <p className="mt-1 text-sm text-stone-500">{catEmoji(p.categorie || '')} {p.categorie || 'Sans catégorie'}</p>
                              </div>
                              <div className="flex shrink-0 gap-1.5">
                                <button type="button" onClick={() => setEditingProduit({ ...p })}
                                  className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"><Pencil size={16} /></button>
                                <button type="button" onClick={() => deleteProduit(p.id)} disabled={deletingId === p.id}
                                  className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50">
                                  {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                              <div><p className="text-xs font-semibold text-stone-400">Prix</p><p className="text-lg font-extrabold">{p.prix} DA</p></div>
                              {p.prix_promo ? <div className="text-right"><p className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600"><Flame size={13}/> PROMO</p><p className="text-lg font-extrabold text-amber-600">{p.prix_promo} DA</p></div> : null}
                            </div>
                          </div>

                          <div className="border-t border-stone-100 bg-stone-50 p-3">
                            {imageId === p.id ? (
                              <div className="flex items-center gap-2">
                                <input type="file" accept="image/*" disabled={uploadingId === p.id}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(p.id, f) }}
                                  className="min-w-0 flex-1 text-xs" />
                                <button type="button" onClick={() => setImageId(null)} className="rounded-lg bg-white p-2"><X size={15}/></button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setImageId(p.id)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100">
                                {uploadingId === p.id ? <Loader2 size={15} className="animate-spin"/> : <Camera size={15}/>} Ajouter / modifier l'image
                              </button>
                            )}

                            {promoId === p.id ? (
                              <div className="mt-2 flex gap-2">
                                <input type="number" min="0" value={promoValue} onChange={e => setPromoValue(e.target.value)}
                                  placeholder="Prix promo (DA)" className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-100" />
                                <button type="button" onClick={() => updatePromo(p.id)} disabled={savingPromo}
                                  className="rounded-xl bg-amber-500 px-4 font-bold text-white disabled:opacity-60">
                                  {savingPromo ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                                </button>
                                <button type="button" onClick={() => { setPromoId(null); setPromoValue('') }} className="rounded-xl bg-white px-3"><X size={16}/></button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => openPromo(p)}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100">
                                <Flame size={15}/> {p.prix_promo ? 'Modifier la promo' : 'Ajouter une promo'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {page === 'commandes' && (
          <section>
            <h2 className="text-xl font-extrabold">Commandes</h2>
            <p className="mb-4 text-sm text-stone-500">Gérez les commandes reçues par votre commerce.</p>
            {commandes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-12 text-center">
                <Bike size={42} className="mx-auto mb-3 text-stone-300"/><p className="font-bold">Aucune commande</p>
              </div>
            ) : commandes.map(cmd => (
              <article key={cmd.id} className="mb-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div><h3 className="font-extrabold">Commande #{cmd.id}</h3><p className="text-sm text-stone-500">{cmd.acheteur_nom} • {cmd.acheteur_telephone}</p></div>
                  <p className="text-xl font-extrabold text-amber-600">{cmd.prix_total} DA</p>
                </div>
                <select value={cmd.statut} disabled={updatingCommandeId === cmd.id}
                  onChange={e => changeCommandeStatut(cmd.id, e.target.value)}
                  className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-100 disabled:opacity-60">
                  <option value="en_attente">En attente</option>
                  <option value="en_route">En route</option>
                  <option value="livre">Livrée</option>
                </select>
              </article>
            ))}
          </section>
        )}

        {page === 'stats' && (
          <section>
            <h2 className="text-xl font-extrabold">Statistiques</h2>
            <p className="mb-4 text-sm text-stone-500">Vue rapide de l'activité du commerce.</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat title="Commandes livrées" value={stats?.nb_terminees || 0}/>
              <Stat title="Chiffre d'affaires" value={`${stats?.chiffre_affaires || 0} DA`} accent/>
              <Stat title="Panier moyen" value={`${stats?.panier_moyen || 0} DA`}/>
              <Stat title="Note moyenne" value={`${(stats?.note_moyenne || 0).toFixed(1)} ⭐`}/>
            </div>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
              <p className="font-bold">Livreurs associés</p>
              <p className="text-sm text-stone-500">{livreurs.length} livreur{livreurs.length > 1 ? 's' : ''}</p>
            </div>
          </section>
        )}

        {page === 'infos' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 text-center">
            <Store size={42} className="mx-auto mb-3 text-stone-300"/>
            <h2 className="text-xl font-extrabold">Informations du commerce</h2>
            <p className="mt-2 text-sm text-stone-500">{session.nom}<br/>{session.telephone}</p>
          </section>
        )}
      </main>
    </div>
  )
}

function Stat({ title, value, accent = false }: { title: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-stone-500">{title}</p>
      <p className={`mt-2 text-2xl font-extrabold ${accent ? 'text-amber-600' : 'text-stone-950'}`}>{value}</p>
    </div>
  )
}
