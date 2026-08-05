'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Package, Bike, BarChart3, Store, Camera, Pencil, Trash2, Check, X } from 'lucide-react'
import { fournisseurApi } from '@/lib/api'
import type { Produit, Commande, Fournisseur, Livreur } from '@/lib/api'
import { CATEGORIES_PRODUITS, catEmoji, normalizeCategory } from '@/lib/categories'

interface FournisseurDashboardProps {
  session: {
    fournisseur_id: number
    nom: string
    telephone: string
  }
  onLogout: () => void
}

export function FournisseurDashboard({ session, onLogout }: FournisseurDashboardProps) {
  const [page, setPage] = useState<'produits' | 'commandes' | 'stats' | 'infos'>('produits')
  const [produits, setProduits] = useState<Produit[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null)
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [prixPromo, setPrixPromo] = useState('')
  const [categorie, setCategorie] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPromoForm, setShowPromoForm] = useState<number | null>(null)
  const [showImageUpload, setShowImageUpload] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState('')

  // Suggestions filtrées
  const suggestions = categorie.trim()
    ? CATEGORIES_PRODUITS.filter((c) =>
        c.toLowerCase().includes(categorie.toLowerCase())
      )
    : CATEGORIES_PRODUITS

  useEffect(() => {
    const load = async () => {
      try {
        const [prod, cmd, liv, st] = await Promise.all([
          fournisseurApi.produits(session.fournisseur_id),
          fournisseurApi.commandes(session.fournisseur_id, false),
          fournisseurApi.livreurs(session.fournisseur_id),
          fournisseurApi.statistiques(session.fournisseur_id, 'tout'),
        ])
        setProduits(prod || [])
        setCommandes(cmd || [])
        setLivreurs(liv || [])
        setStats(st)
      } catch (e) {
        console.error('Erreur chargement', e)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session.fournisseur_id])

  const addProduit = async () => {
    if (!nom || !prix || !categorie) {
      setError('Veuillez remplir tous les champs')
      return
    }
    try {
      setError('')
      await fournisseurApi.creerProduit({
        fournisseur_id: session.fournisseur_id,
        nom,
        prix: parseFloat(prix),
        prix_promo: prixPromo ? parseFloat(prixPromo) : undefined,
        categorie: normalizeCategory(categorie),
        disponible: true,
      })
      const prod = await fournisseurApi.produits(session.fournisseur_id)
      setProduits(prod || [])
      setNom('')
      setPrix('')
      setPrixPromo('')
      setCategorie('')
      setShowSuggestions(false)
    } catch (e) {
      console.error('Erreur création', e)
      setError('Erreur lors de l\'ajout du produit')
    }
  }

  const updateProduit = async (p: Produit) => {
    if (!editingProduit) return
    try {
      await fournisseurApi.modifierProduit(p.id, {
        nom: editingProduit.nom,
        prix: editingProduit.prix,
        categorie: editingProduit.categorie,
      })
      const prod = await fournisseurApi.produits(session.fournisseur_id)
      setProduits(prod || [])
      setEditingProduit(null)
      setError('')
    } catch (e) {
      console.error('Erreur modification', e)
      setError('Erreur lors de la modification')
    }
  }

  const deleteProduit = async (id: number) => {
    if (!confirm('Supprimer ce produit?')) return
    try {
      await fournisseurApi.supprimerProduit(id)
      setProduits(produits.filter((p) => p.id !== id))
      setError('')
    } catch (e) {
      console.error('Erreur suppression', e)
      setError('Erreur lors de la suppression')
    }
  }

  const updatePromo = async (id: number) => {
    try {
      await fournisseurApi.modifierProduit(id, { prix_promo: parseFloat(prixPromo) })
      const prod = await fournisseurApi.produits(session.fournisseur_id)
      setProduits(prod || [])
      setShowPromoForm(null)
      setPrixPromo('')
      setError('')
    } catch (e) {
      console.error('Erreur promo', e)
      setError('Erreur lors de la mise à jour de la promo')
    }
  }

  const uploadImage = async (produitId: number, file: File) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      await fournisseurApi.uploadImage(produitId, fd)
      const prod = await fournisseurApi.produits(session.fournisseur_id)
      setProduits(prod || [])
      setShowImageUpload(null)
      setError('')
    } catch (e) {
      console.error('Erreur image', e)
      setError('Erreur lors de l\'upload de l\'image')
    }
  }

  const changeCommandeStatut = async (cmdId: number, newStatut: string) => {
    try {
      await fournisseurApi.changerStatut(cmdId, newStatut)
      const cmd = await fournisseurApi.commandes(session.fournisseur_id, false)
      setCommandes(cmd || [])
      setError('')
    } catch (e) {
      console.error('Erreur statut', e)
      setError('Erreur lors de la mise à jour du statut')
    }
  }

  if (loading) return <div className="p-5 text-center">Chargement...</div>

  return (
    <div className="min-h-screen bg-stone-50">
      {/* HEADER */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onLogout} className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-all">
          <ArrowLeft size={20} />
          <span className="font-semibold text-stone-900">{session.nom}</span>
        </button>
        <div className="flex gap-2">
          {(['produits', 'commandes', 'stats', 'infos'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                page === p ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {p === 'produits' && <Package size={16} className="inline mr-1" />}
              {p === 'commandes' && <Bike size={16} className="inline mr-1" />}
              {p === 'stats' && <BarChart3 size={16} className="inline mr-1" />}
              {p === 'infos' && <Store size={16} className="inline mr-1" />}
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-5 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-900">
            <X size={20} />
          </button>
        </div>
      )}

      {/* PAGE PRODUITS */}
      {page === 'produits' && (
        <div className="p-5 space-y-5">
          <div className="bg-white rounded-xl p-4 space-y-3 border border-stone-200">
            <h3 className="font-bold text-stone-900">Ajouter un produit</h3>
            
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom du produit"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            
            <input
              type="number"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="Prix (DA)"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {/* CATEGORIE AUTOCOMPLETE */}
            <div className="relative w-full">
              <p className="text-xs font-bold text-stone-500 mb-2">Catégorie *</p>
              <input
                value={categorie}
                onChange={(e) => {
                  setCategorie(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Tapez ou choisissez une catégorie..."
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {/* SUGGESTIONS DROPDOWN */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {suggestions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategorie(cat)
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 border-b border-stone-100 last:border-0 text-sm font-medium text-stone-900 transition-all"
                    >
                      {catEmoji(cat)} {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={addProduit}
              className="w-full bg-amber-500 text-white font-semibold py-2 rounded-lg hover:bg-amber-600 active:scale-95 transition-all"
            >
              + Ajouter
            </button>
          </div>

          {/* PRODUITS LIST */}
          <div className="space-y-3">
            {produits.length === 0 ? (
              <div className="text-center py-10 text-stone-500">
                <Package size={32} className="mx-auto mb-2 text-stone-300" />
                <p>Aucun produit</p>
              </div>
            ) : (
              produits.map((p) => (
                <div key={p.id} className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                  {editingProduit?.id === p.id ? (
                    <>
                      <input
                        value={editingProduit.nom}
                        onChange={(e) => setEditingProduit({ ...editingProduit, nom: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={editingProduit.prix}
                        onChange={(e) => setEditingProduit({ ...editingProduit, prix: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateProduit(p)} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 active:scale-95 transition-all">
                          <Check size={16} className="inline mr-1" /> Sauvegarder
                        </button>
                        <button onClick={() => setEditingProduit(null)} className="flex-1 bg-stone-200 text-stone-900 py-2 rounded-lg font-semibold hover:bg-stone-300 active:scale-95 transition-all">
                          <X size={16} className="inline mr-1" /> Annuler
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-stone-900">{p.nom}</h4>
                          <p className="text-sm text-stone-500">
                            {catEmoji(p.categorie || '')} {p.categorie} • {p.prix} DA
                            {p.prix_promo && <span className="ml-2 text-amber-600 font-bold">{p.prix_promo} DA 🔥</span>}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingProduit(p)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 active:scale-95 transition-all">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteProduit(p.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 active:scale-95 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {showImageUpload === p.id ? (
                        <input
                          type="file"
                          onChange={(e) => e.target.files?.[0] && uploadImage(p.id, e.target.files[0])}
                          className="w-full text-xs"
                        />
                      ) : (
                        <button onClick={() => setShowImageUpload(p.id)} className="w-full py-2 bg-stone-100 text-stone-600 rounded-lg text-xs font-semibold hover:bg-stone-200 active:scale-95 transition-all">
                          <Camera size={14} className="inline mr-1" /> Image
                        </button>
                      )}

                      {showPromoForm === p.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={prixPromo}
                            onChange={(e) => setPrixPromo(e.target.value)}
                            placeholder="Prix promo (DA)"
                            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button onClick={() => updatePromo(p.id)} className="px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 active:scale-95 transition-all">
                            ✓
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowPromoForm(p.id)} className="w-full py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold hover:bg-amber-100 active:scale-95 transition-all">
                          🔥 {p.prix_promo ? 'Modifier promo' : 'Ajouter promo'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PAGE COMMANDES */}
      {page === 'commandes' && (
        <div className="p-5 space-y-3">
          {commandes.length === 0 ? (
            <div className="text-center py-10 text-stone-500">
              <Bike size={32} className="mx-auto mb-2 text-stone-300" />
              <p>Aucune commande</p>
            </div>
          ) : (
            commandes.map((cmd) => (
              <div key={cmd.id} className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-stone-900">Commande #{cmd.id}</h4>
                    <p className="text-sm text-stone-500">{cmd.acheteur_nom} • {cmd.acheteur_telephone}</p>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{cmd.prix_total} DA</span>
                </div>
                <select
                  value={cmd.statut}
                  onChange={(e) => changeCommandeStatut(cmd.id, e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="en_attente">En attente</option>
                  <option value="en_route">En route</option>
                  <option value="livre">Livrée</option>
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {/* PAGE STATS */}
      {page === 'stats' && stats && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-center">
              <p className="text-xs text-stone-500 font-semibold">Commandes livrées</p>
              <h3 className="text-3xl font-bold text-stone-900 mt-2">{stats.nb_terminees || 0}</h3>
            </div>
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-center">
              <p className="text-xs text-stone-500 font-semibold">Chiffre d'affaires</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-2">{stats.chiffre_affaires || 0} DA</h3>
            </div>
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-center">
              <p className="text-xs text-stone-500 font-semibold">Panier moyen</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-2">{stats.panier_moyen || 0} DA</h3>
            </div>
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-center">
              <p className="text-xs text-stone-500 font-semibold">Note moyenne</p>
              <h3 className="text-2xl font-bold text-yellow-500 mt-2">{(stats.note_moyenne || 0).toFixed(1)} ⭐</h3>
            </div>
          </div>
        </div>
      )}

      {/* PAGE INFOS */}
      {page === 'infos' && (
        <div className="p-5 text-center text-stone-600">
          <Store size={32} className="mx-auto mb-2 text-stone-300" />
          <p>Infos du commerce à compléter...</p>
        </div>
      )}
    </div>
  )
}
