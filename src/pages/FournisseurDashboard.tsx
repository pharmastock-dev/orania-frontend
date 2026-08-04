'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Package,
  Bike,
  BarChart3,
  Store,
  Camera,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  RefreshCw,
  Loader2,
  Flame,
  MapPin,
  Clock,
  Phone,
  Navigation,
  Truck,
} from 'lucide-react'

import { fournisseurApi } from '@/lib/api'
import type { Produit, Commande, Livreur } from '@/lib/api'
import { CATEGORIES_PRODUITS, catEmoji, normalizeCategory } from '@/lib/categories'
import { MapPicker } from '@/components/Map'

interface FournisseurDashboardProps {
  session: {
    fournisseur_id: number
    nom: string
    telephone: string
  }
  onLogout: () => void
}

type Page = 'produits' | 'commandes' | 'stats' | 'infos'

type Position = {
  lat: number
  lng: number
}

type InfosFournisseur = {
  id?: number
  nom?: string
  telephone?: string
  adresse?: string
  categorie?: string
  heure_ouverture?: string | null
  heure_fermeture?: string | null
  presentation?: string | null
  latitude?: number | null
  longitude?: number | null
  livraison_gratuite?: boolean | null
  frais_min?: number | null
  frais_max?: number | null
  image_url?: string | null
}

const labels: Record<Page, string> = {
  produits: 'Produits',
  commandes: 'Commandes',
  stats: 'Stats',
  infos: 'Mon commerce',
}

export function FournisseurDashboard({
  session,
  onLogout,
}: FournisseurDashboardProps) {
  const [page, setPage] = useState<Page>('produits')

  const [produits, setProduits] = useState<Produit[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [stats, setStats] = useState<any>(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ─────────────────────────────────────────────
  // AJOUT PRODUIT
  // ─────────────────────────────────────────────

  const [nomProduit, setNomProduit] = useState('')
  const [prixProduit, setPrixProduit] = useState('')
  const [prixPromo, setPrixPromo] = useState('')
  const [categorie, setCategorie] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [adding, setAdding] = useState(false)

  // ─────────────────────────────────────────────
  // MODIFICATION PRODUIT
  // ─────────────────────────────────────────────

  const [editingProduit, setEditingProduit] =
    useState<Produit | null>(null)

  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ─────────────────────────────────────────────
  // PROMOTION
  // ─────────────────────────────────────────────

  const [promoId, setPromoId] = useState<number | null>(null)
  const [promoValue, setPromoValue] = useState('')
  const [savingPromo, setSavingPromo] = useState(false)

  // ─────────────────────────────────────────────
  // IMAGE PRODUIT
  // ─────────────────────────────────────────────

  const [imageId, setImageId] = useState<number | null>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)

  // ─────────────────────────────────────────────
  // COMMANDES
  // ─────────────────────────────────────────────

  const [updatingCommandeId, setUpdatingCommandeId] =
    useState<number | null>(null)

  // ─────────────────────────────────────────────
  // INFOS FOURNISSEUR
  // ─────────────────────────────────────────────

  const [infos, setInfos] = useState<InfosFournisseur | null>(null)
  const [loadingInfos, setLoadingInfos] = useState(false)
  const [savingInfos, setSavingInfos] = useState(false)

  const [commerceNom, setCommerceNom] = useState('')
  const [commerceTelephone, setCommerceTelephone] = useState('')
  const [commerceAdresse, setCommerceAdresse] = useState('')
  const [commerceCategorie, setCommerceCategorie] = useState('')
  const [heureOuverture, setHeureOuverture] = useState('')
  const [heureFermeture, setHeureFermeture] = useState('')
  const [presentation, setPresentation] = useState('')

  const [livraisonGratuite, setLivraisonGratuite] =
    useState(false)

  const [fraisMin, setFraisMin] = useState('')
  const [fraisMax, setFraisMax] = useState('')

  const [position, setPosition] = useState<Position | null>(null)

  const [imageCommerce, setImageCommerce] = useState<string | null>(null)
  const [uploadingCommerce, setUploadingCommerce] = useState(false)

  // ─────────────────────────────────────────────
  // SUGGESTIONS CATEGORIES
  // ─────────────────────────────────────────────

  const suggestions = useMemo(() => {
    const q = categorie.trim().toLowerCase()

    if (!q) {
      return CATEGORIES_PRODUITS
    }

    return CATEGORIES_PRODUITS.filter((c) =>
      c.toLowerCase().includes(q)
    )
  }, [categorie])

  // ─────────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────────

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const showSuccess = (message: string) => {
    setError('')
    setSuccess(message)

    window.setTimeout(() => {
      setSuccess('')
    }, 3000)
  }

  const showError = (message: string) => {
    setSuccess('')
    setError(message)
  }

  // ─────────────────────────────────────────────
  // CHARGEMENT PRINCIPAL
  // ─────────────────────────────────────────────

  const loadData = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true)
    }

    setError('')

    try {
      /*
       * IMPORTANT :
       * On ne fait PAS Promise.all ici.
       *
       * Si les statistiques échouent, les produits doivent
       * quand même être affichés.
       */

      const resultats = await Promise.allSettled([
        fournisseurApi.produits(session.fournisseur_id),
        fournisseurApi.commandes(session.fournisseur_id, false),
        fournisseurApi.livreurs(session.fournisseur_id),
        fournisseurApi.statistiques(session.fournisseur_id, 'tout'),
      ])

      const [prodResult, cmdResult, livResult, statsResult] =
        resultats

      if (prodResult.status === 'fulfilled') {
        setProduits(
          Array.isArray(prodResult.value)
            ? prodResult.value
            : []
        )
      }

      if (cmdResult.status === 'fulfilled') {
        setCommandes(
          Array.isArray(cmdResult.value)
            ? cmdResult.value
            : []
        )
      }

      if (livResult.status === 'fulfilled') {
        setLivreurs(
          Array.isArray(livResult.value)
            ? livResult.value
            : []
        )
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value || null)
      }

      /*
       * Si les produits ET les commandes ont échoué,
       * là on considère qu'il y a un vrai problème serveur.
       */

      const produitsOk =
        prodResult.status === 'fulfilled'

      const commandesOk =
        cmdResult.status === 'fulfilled'

      if (!produitsOk && !commandesOk) {
        throw new Error(
          'Impossible de communiquer avec le serveur.'
        )
      }
    } catch (e) {
      console.error('Erreur chargement fournisseur:', e)

      showError(
        'Impossible de charger les données du commerce. Vérifiez la connexion au serveur.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [session.fournisseur_id])

  // ─────────────────────────────────────────────
  // CHARGER INFOS FOURNISSEUR
  // ─────────────────────────────────────────────

  const loadInfos = async () => {
    setLoadingInfos(true)

    try {
      const data = await fournisseurApi.getInfos(
        session.fournisseur_id
      )

      const f: InfosFournisseur = data || {}

      setInfos(f)

      setCommerceNom(
        f.nom || session.nom || ''
      )

      setCommerceTelephone(
        f.telephone || session.telephone || ''
      )

      setCommerceAdresse(
        f.adresse || ''
      )

      setCommerceCategorie(
        f.categorie || ''
      )

      setHeureOuverture(
        f.heure_ouverture
          ? f.heure_ouverture.slice(0, 5)
          : ''
      )

      setHeureFermeture(
        f.heure_fermeture
          ? f.heure_fermeture.slice(0, 5)
          : ''
      )

      setPresentation(
        f.presentation || ''
      )

      setLivraisonGratuite(
        Boolean(f.livraison_gratuite)
      )

      setFraisMin(
        f.frais_min != null
          ? String(f.frais_min)
          : ''
      )

      setFraisMax(
        f.frais_max != null
          ? String(f.frais_max)
          : ''
      )

      if (
        f.latitude != null &&
        f.longitude != null
      ) {
        setPosition({
          lat: Number(f.latitude),
          lng: Number(f.longitude),
        })
      } else {
        setPosition(null)
      }

      setImageCommerce(
        f.image_url || null
      )
    } catch (e) {
      console.error(
        'Erreur chargement infos:',
        e
      )

      showError(
        'Impossible de charger les informations du commerce.'
      )
    } finally {
      setLoadingInfos(false)
    }
  }

  useEffect(() => {
    if (page === 'infos') {
      loadInfos()
    }
  }, [page, session.fournisseur_id])

  // ─────────────────────────────────────────────
  // AJOUT PRODUIT
  // ─────────────────────────────────────────────

  const addProduit = async () => {
    clearMessages()

    const nom = nomProduit.trim()
    const prix = Number(prixProduit)

    if (!nom) {
      showError('Veuillez saisir le nom du produit.')
      return
    }

    if (
      !prixProduit.trim() ||
      !Number.isFinite(prix) ||
      prix <= 0
    ) {
      showError('Veuillez saisir un prix valide.')
      return
    }

    if (!categorie.trim()) {
      showError('Veuillez choisir une catégorie.')
      return
    }

    const promo =
      prixPromo.trim()
        ? Number(prixPromo)
        : undefined

    if (
      promo !== undefined &&
      (!Number.isFinite(promo) || promo <= 0)
    ) {
      showError('Le prix promo est invalide.')
      return
    }

    if (
      promo !== undefined &&
      promo >= prix
    ) {
      showError(
        'Le prix promo doit être inférieur au prix normal.'
      )
      return
    }

    setAdding(true)

    try {
      await fournisseurApi.ajouterProduit({
        fournisseur_id:
          session.fournisseur_id,

        nom,

        prix,

        prix_promo: promo,

        categorie:
          normalizeCategory(categorie),

        disponible: true,
      })

      /*
       * On recharge UNIQUEMENT les produits.
       * Une erreur stats/commandes ne peut donc pas empêcher
       * l'affichage du nouveau produit.
       */

      const prod =
        await fournisseurApi.produits(
          session.fournisseur_id
        )

      setProduits(
        Array.isArray(prod)
          ? prod
          : []
      )

      setNomProduit('')
      setPrixProduit('')
      setPrixPromo('')
      setCategorie('')
      setShowSuggestions(false)

      showSuccess(
        'Produit ajouté avec succès.'
      )
    } catch (e) {
      console.error(
        'Erreur création produit:',
        e
      )

      showError(
        'Le produit n’a pas pu être ajouté. Vérifiez la connexion au serveur.'
      )
    } finally {
      setAdding(false)
    }
  }

  // ─────────────────────────────────────────────
  // MODIFICATION PRODUIT
  // ─────────────────────────────────────────────

  const saveProduit = async () => {
    if (!editingProduit) return

    clearMessages()

    const nom = editingProduit.nom.trim()
    const prix = Number(editingProduit.prix)

    if (!nom) {
      showError('Nom du produit invalide.')
      return
    }

    if (
      !Number.isFinite(prix) ||
      prix <= 0
    ) {
      showError('Prix du produit invalide.')
      return
    }

    setSavingEdit(true)

    try {
      await fournisseurApi.modifierProduit(
        editingProduit.id,
        {
          nom,
          prix,
          categorie:
            editingProduit.categorie
              ? normalizeCategory(
                  editingProduit.categorie
                )
              : editingProduit.categorie,
        }
      )

      const prod =
        await fournisseurApi.produits(
          session.fournisseur_id
        )

      setProduits(
        Array.isArray(prod)
          ? prod
          : []
      )

      setEditingProduit(null)

      showSuccess(
        'Produit modifié avec succès.'
      )
    } catch (e) {
      console.error(
        'Erreur modification:',
        e
      )

      showError(
        'Impossible de modifier ce produit.'
      )
    } finally {
      setSavingEdit(false)
    }
  }

  // ─────────────────────────────────────────────
  // SUPPRESSION PRODUIT
  // ─────────────────────────────────────────────

  const deleteProduit = async (
    id: number
  ) => {
    if (
      !confirm(
        'Voulez-vous vraiment supprimer ce produit ?'
      )
    ) {
      return
    }

    clearMessages()
    setDeletingId(id)

    try {
      await fournisseurApi.supprimerProduit(id)

      setProduits((current) =>
        current.filter(
          (p) => p.id !== id
        )
      )

      if (promoId === id) {
        setPromoId(null)
        setPromoValue('')
      }

      if (imageId === id) {
        setImageId(null)
      }

      showSuccess(
        'Produit supprimé.'
      )
    } catch (e) {
      console.error(
        'Erreur suppression:',
        e
      )

      showError(
        'Impossible de supprimer ce produit.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ─────────────────────────────────────────────
  // PROMOTION
  // ─────────────────────────────────────────────

  const openPromo = (
    p: Produit
  ) => {
    setPromoId(p.id)

    setPromoValue(
      p.prix_promo != null
        ? String(p.prix_promo)
        : ''
    )
  }

  const updatePromo = async (
    id: number
  ) => {
    const p =
      produits.find(
        (x) => x.id === id
      )

    if (!p) return

    const value =
      Number(promoValue)

    if (
      !promoValue.trim() ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      showError(
        'Veuillez saisir un prix promo valide.'
      )
      return
    }

    if (
      value >= Number(p.prix)
    ) {
      showError(
        'Le prix promo doit être inférieur au prix normal.'
      )
      return
    }

    setSavingPromo(true)
    clearMessages()

    try {
      await fournisseurApi.modifierProduit(
        id,
        {
          prix_promo: value,
        }
      )

      const prod =
        await fournisseurApi.produits(
          session.fournisseur_id
        )

      setProduits(
        Array.isArray(prod)
          ? prod
          : []
      )

      setPromoId(null)
      setPromoValue('')

      showSuccess(
        'Promotion enregistrée.'
      )
    } catch (e) {
      console.error(
        'Erreur promo:',
        e
      )

      showError(
        'Impossible de modifier la promotion.'
      )
    } finally {
      setSavingPromo(false)
    }
  }

  // ─────────────────────────────────────────────
  // IMAGE PRODUIT
  // ─────────────────────────────────────────────

  const uploadImage = async (
    id: number,
    file: File
  ) => {
    setUploadingId(id)
    clearMessages()

    try {
      await fournisseurApi.uploadImageProduit(
        id,
        file
      )

      const prod =
        await fournisseurApi.produits(
          session.fournisseur_id
        )

      setProduits(
        Array.isArray(prod)
          ? prod
          : []
      )

      setImageId(null)

      showSuccess(
        'Image ajoutée avec succès.'
      )
    } catch (e) {
      console.error(
        'Erreur image:',
        e
      )

      showError(
        'Impossible d’ajouter cette image.'
      )
    } finally {
      setUploadingId(null)
    }
  }

  // ─────────────────────────────────────────────
  // STATUT COMMANDE
  // ─────────────────────────────────────────────

  const changeCommandeStatut = async (
    id: number,
    statut: string
  ) => {
    setUpdatingCommandeId(id)
    clearMessages()

    try {
      await fournisseurApi.changerStatut(
        id,
        statut
      )

      const cmd =
        await fournisseurApi.commandes(
          session.fournisseur_id,
          false
        )

      setCommandes(
        Array.isArray(cmd)
          ? cmd
          : []
      )

      showSuccess(
        'Statut de la commande mis à jour.'
      )
    } catch (e) {
      console.error(
        'Erreur statut:',
        e
      )

      showError(
        'Impossible de modifier le statut.'
      )
    } finally {
      setUpdatingCommandeId(null)
    }
  }

  // ─────────────────────────────────────────────
  // SAUVEGARDE INFOS COMMERCE
  // ─────────────────────────────────────────────

  const saveInfos = async () => {
    clearMessages()

    if (!commerceNom.trim()) {
      showError(
        'Le nom du commerce est obligatoire.'
      )
      return
    }

    setSavingInfos(true)

    try {
      await fournisseurApi.modifierInfos(
        session.fournisseur_id,
        {
          nom:
            commerceNom.trim(),

          telephone:
            commerceTelephone.trim(),

          adresse:
            commerceAdresse.trim(),

          categorie:
            commerceCategorie.trim(),

          heure_ouverture:
            heureOuverture || undefined,

          heure_fermeture:
            heureFermeture || undefined,

          presentation:
            presentation.trim(),

          livraison_gratuite:
            livraisonGratuite,

          frais_min:
            !livraisonGratuite &&
            fraisMin.trim()
              ? Number(fraisMin)
              : undefined,

          frais_max:
            !livraisonGratuite &&
            fraisMax.trim()
              ? Number(fraisMax)
              : undefined,

          latitude:
            position
              ? position.lat
              : undefined,

          longitude:
            position
              ? position.lng
              : undefined,
        }
      )

      /*
       * On met aussi à jour la session locale pour
       * garder le nom affiché dans le header.
       */

      try {
        const saved =
          localStorage.getItem(
            'fournisseur'
          )

        if (saved) {
          const parsed =
            JSON.parse(saved)

          localStorage.setItem(
            'fournisseur',
            JSON.stringify({
              ...parsed,
              nom:
                commerceNom.trim(),
              telephone:
                commerceTelephone.trim(),
            })
          )
        }
      } catch {}

      setInfos((current) => ({
        ...(current || {}),
        nom: commerceNom.trim(),
        telephone:
          commerceTelephone.trim(),
        adresse:
          commerceAdresse.trim(),
        categorie:
          commerceCategorie.trim(),
        heure_ouverture:
          heureOuverture || null,
        heure_fermeture:
          heureFermeture || null,
        presentation:
          presentation.trim(),
        livraison_gratuite:
          livraisonGratuite,
        frais_min:
          !livraisonGratuite &&
          fraisMin
            ? Number(fraisMin)
            : null,
        frais_max:
          !livraisonGratuite &&
          fraisMax
            ? Number(fraisMax)
            : null,
        latitude:
          position?.lat ?? null,
        longitude:
          position?.lng ?? null,
      }))

      showSuccess(
        'Informations du commerce enregistrées.'
      )
    } catch (e) {
      console.error(
        'Erreur sauvegarde infos:',
        e
      )

      showError(
        'Impossible d’enregistrer les informations du commerce.'
      )
    } finally {
      setSavingInfos(false)
    }
  }

  // ─────────────────────────────────────────────
  // PHOTO COMMERCE
  // ─────────────────────────────────────────────

  const uploadCommerceImage = async (
    file: File
  ) => {
    setUploadingCommerce(true)
    clearMessages()

    try {
      const result =
        await fournisseurApi.uploadImageMagasin(
          session.fournisseur_id,
          file
        )

      if (result?.image_url) {
        setImageCommerce(
          result.image_url
        )
      }

      showSuccess(
        'Photo du commerce mise à jour.'
      )
    } catch (e) {
      console.error(
        'Erreur photo commerce:',
        e
      )

      showError(
        'Impossible de modifier la photo du commerce.'
      )
    } finally {
      setUploadingCommerce(false)
    }
  }

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-600">
          <Loader2
            size={32}
            className="animate-spin"
          />

          <p className="font-semibold">
            Chargement du commerce...
          </p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────

  const navItems: {
    key: Page
    icon: typeof Package
  }[] = [
    {
      key: 'produits',
      icon: Package,
    },
    {
      key: 'commandes',
      icon: Bike,
    },
    {
      key: 'stats',
      icon: BarChart3,
    },
    {
      key: 'infos',
      icon: Store,
    },
  ]

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">

      {/* ═══════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════ */}

      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">

        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">

          <div className="flex items-center justify-between gap-3">

            <button
              type="button"
              onClick={onLogout}
              className="flex min-w-0 items-center gap-2 rounded-xl text-left"
            >
              <ArrowLeft
                size={20}
                className="shrink-0 text-stone-500"
              />

              <div className="min-w-0">
                <p className="truncate text-base font-extrabold sm:text-lg">
                  {commerceNom || session.nom}
                </p>

                <p className="text-xs text-stone-500">
                  Espace fournisseur
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              <span className="hidden sm:inline">
                Actualiser
              </span>
            </button>

          </div>

          {/* NAVIGATION MOBILE SCROLLABLE */}
          <nav className="mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            <div className="flex min-w-max gap-2 px-1">

              {navItems.map(
                ({ key, icon: Icon }) => {

                  const active =
                    page === key

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        clearMessages()
                        setPage(key)
                      }}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        active
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <Icon size={17} />

                      {labels[key]}

                      {key === 'commandes' &&
                        commandes.length > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                              active
                                ? 'bg-white/20'
                                : 'bg-white'
                            }`}
                          >
                            {commandes.length}
                          </span>
                        )}
                    </button>
                  )
                }
              )}

            </div>

          </nav>

        </div>
      </header>

      {/* ═══════════════════════════════════════ */}
      {/* MESSAGES */}
      {/* ═══════════════════════════════════════ */}

      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">

        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <div>
              <p className="font-bold">
                Erreur
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              className="shrink-0 rounded-lg p-1 hover:bg-red-100"
            >
              <X size={17} />
            </button>

          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <div className="flex items-center gap-2">
              <Check size={18} />

              <span className="font-semibold">
                {success}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSuccess('')}
              className="rounded-lg p-1 hover:bg-emerald-100"
            >
              <X size={17} />
            </button>

          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CONTENU */}
      {/* ═══════════════════════════════════════ */}

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">

        {/* ═══════════════════════════════════ */}
        {/* PRODUITS */}
        {/* ═══════════════════════════════════ */}

        {page === 'produits' && (
          <div className="space-y-5">

            {/* AJOUT PRODUIT */}

            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">

              <div className="flex items-start justify-between gap-3">

                <div>
                  <h2 className="text-xl font-extrabold">
                    Ajouter un produit
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Ajoutez rapidement un article à votre catalogue.
                  </p>
                </div>

                <div className="hidden rounded-xl bg-amber-50 p-3 text-amber-600 sm:block">
                  <Plus size={20} />
                </div>

              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <input
                  value={nomProduit}
                  onChange={(e) =>
                    setNomProduit(e.target.value)
                  }
                  placeholder="Nom du produit"
                  disabled={adding}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />

                <input
                  type="number"
                  min="0"
                  value={prixProduit}
                  onChange={(e) =>
                    setPrixProduit(e.target.value)
                  }
                  placeholder="Prix (DA)"
                  disabled={adding}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />

                <input
                  type="number"
                  min="0"
                  value={prixPromo}
                  onChange={(e) =>
                    setPrixPromo(e.target.value)
                  }
                  placeholder="Prix promo (facultatif)"
                  disabled={adding}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />

                <div className="relative">

                  <input
                    value={categorie}
                    onChange={(e) => {
                      setCategorie(
                        e.target.value
                      )
                      setShowSuggestions(true)
                    }}
                    onFocus={() =>
                      setShowSuggestions(true)
                    }
                    onBlur={() => {
                      window.setTimeout(
                        () =>
                          setShowSuggestions(false),
                        150
                      )
                    }}
                    autoComplete="off"
                    placeholder="Catégorie"
                    disabled={adding}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                  />

                  {showSuggestions &&
                    suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl">

                        {suggestions.map(
                          (cat) => (
                            <button
                              key={cat}
                              type="button"
                              onMouseDown={(e) =>
                                e.preventDefault()
                              }
                              onClick={() => {
                                setCategorie(cat)
                                setShowSuggestions(false)
                              }}
                              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-amber-50"
                            >
                              {catEmoji(cat)} {cat}
                            </button>
                          )
                        )}

                      </div>
                    )}

                </div>

              </div>

              <button
                type="button"
                onClick={addProduit}
                disabled={adding}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Plus size={19} />

                    Ajouter le produit
                  </>
                )}
              </button>

            </section>

            {/* PRODUITS */}

            <section>

              <div className="mb-3 flex items-end justify-between">

                <div>
                  <h2 className="text-lg font-extrabold">
                    Mes produits
                  </h2>

                  <p className="text-sm text-stone-500">
                    {produits.length}{' '}
                    produit
                    {produits.length > 1
                      ? 's'
                      : ''}
                  </p>
                </div>

              </div>

              {produits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-14 text-center">

                  <Package
                    size={44}
                    className="mx-auto mb-3 text-stone-300"
                  />

                  <p className="font-bold text-stone-700">
                    Aucun produit
                  </p>

                  <p className="mt-1 text-sm text-stone-400">
                    Ajoutez votre premier produit ci-dessus.
                  </p>

                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  {produits.map((p) => (

                    <article
                      key={p.id}
                      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                    >

                      {/* IMAGE */}

                      {p.image_url ? (
                        <div className="h-44 w-full overflow-hidden bg-stone-100">

                          <img
                            src={p.image_url}
                            alt={p.nom}
                            className="h-full w-full object-cover"
                          />

                        </div>
                      ) : null}

                      <div className="p-4">

                        {editingProduit?.id === p.id ? (

                          <div className="space-y-3">

                            <input
                              value={
                                editingProduit.nom
                              }
                              onChange={(e) =>
                                setEditingProduit({
                                  ...editingProduit,
                                  nom:
                                    e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                            />

                            <input
                              type="number"
                              value={
                                editingProduit.prix
                              }
                              onChange={(e) =>
                                setEditingProduit({
                                  ...editingProduit,
                                  prix: Number(
                                    e.target.value
                                  ),
                                })
                              }
                              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                            />

                            <input
                              value={
                                editingProduit.categorie ||
                                ''
                              }
                              onChange={(e) =>
                                setEditingProduit({
                                  ...editingProduit,
                                  categorie:
                                    e.target.value,
                                })
                              }
                              placeholder="Catégorie"
                              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                            />

                            <div className="grid grid-cols-2 gap-2">

                              <button
                                type="button"
                                onClick={saveProduit}
                                disabled={
                                  savingEdit
                                }
                                className="flex items-center justify-center gap-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                              >
                                {savingEdit ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={16} />
                                )}

                                Sauver
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduit(
                                    null
                                  )
                                }
                                className="flex items-center justify-center gap-1 rounded-xl bg-stone-100 py-2.5 text-sm font-bold text-stone-600"
                              >
                                <X size={16} />

                                Annuler
                              </button>

                            </div>

                          </div>

                        ) : (

                          <>

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <h3 className="truncate font-extrabold text-stone-800">
                                  {p.nom}
                                </h3>

                                <p className="mt-1 text-sm text-stone-500">
                                  {p.categorie
                                    ? `${catEmoji(
                                        p.categorie
                                      )} ${p.categorie}`
                                    : 'Sans catégorie'}
                                </p>

                              </div>

                              <div className="flex shrink-0 gap-1">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingProduit(
                                      p
                                    )
                                  }
                                  className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                                >
                                  <Pencil
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteProduit(
                                      p.id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    p.id
                                  }
                                  className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                  {deletingId ===
                                  p.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={16}
                                    />
                                  )}
                                </button>

                              </div>

                            </div>

                            <div className="mt-3 flex items-end justify-between">

                              <div>

                                <p className="text-lg font-extrabold text-stone-800">
                                  {p.prix} DA
                                </p>

                                {p.prix_promo != null && (
                                  <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-amber-600">
                                    <Flame size={14} />

                                    {p.prix_promo} DA
                                  </p>
                                )}

                              </div>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  p.disponible
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {p.disponible
                                  ? 'Disponible'
                                  : 'Indisponible'}
                              </span>

                            </div>

                            {/* IMAGE */}

                            <div className="mt-3">

                              {imageId === p.id ? (

                                <div className="flex items-center gap-2">

                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={
                                      uploadingId ===
                                      p.id
                                    }
                                    onChange={(e) => {
                                      const file =
                                        e.target.files?.[0]

                                      if (file) {
                                        uploadImage(
                                          p.id,
                                          file
                                        )
                                      }
                                    }}
                                    className="min-w-0 flex-1 text-xs"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImageId(
                                        null
                                      )
                                    }
                                    className="rounded-lg bg-stone-100 p-2"
                                  >
                                    <X
                                      size={15}
                                    />
                                  </button>

                                </div>

                              ) : (

                                <button
                                  type="button"
                                  onClick={() =>
                                    setImageId(
                                      p.id
                                    )
                                  }
                                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100"
                                >
                                  {uploadingId ===
                                  p.id ? (
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Camera
                                      size={15}
                                    />
                                  )}

                                  Ajouter / modifier l'image
                                </button>

                              )}

                            </div>

                            {/* PROMO */}

                            {promoId === p.id ? (

                              <div className="mt-2 flex gap-2">

                                <input
                                  type="number"
                                  min="0"
                                  value={promoValue}
                                  onChange={(e) =>
                                    setPromoValue(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Prix promo (DA)"
                                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePromo(
                                      p.id
                                    )
                                  }
                                  disabled={
                                    savingPromo
                                  }
                                  className="rounded-xl bg-amber-500 px-4 font-bold text-white disabled:opacity-60"
                                >
                                  {savingPromo ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check
                                      size={16}
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPromoId(
                                      null
                                    )
                                    setPromoValue(
                                      ''
                                    )
                                  }}
                                  className="rounded-xl bg-stone-100 px-3"
                                >
                                  <X size={16} />
                                </button>

                              </div>

                            ) : (

                              <button
                                type="button"
                                onClick={() =>
                                  openPromo(p)
                                }
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                              >
                                <Flame
                                  size={15}
                                />

                                {p.prix_promo
                                  ? 'Modifier la promo'
                                  : 'Ajouter une promo'}
                              </button>

                            )}

                          </>

                        )}

                      </div>

                    </article>

                  ))}

                </div>
              )}

            </section>

          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* COMMANDES */}
        {/* ═══════════════════════════════════ */}

        {page === 'commandes' && (
          <section>

            <div className="mb-4">

              <h2 className="text-xl font-extrabold">
                Commandes
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Gérez les commandes reçues par votre commerce.
              </p>

            </div>

            {commandes.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-14 text-center">

                <Bike
                  size={44}
                  className="mx-auto mb-3 text-stone-300"
                />

                <p className="font-bold">
                  Aucune commande
                </p>

                <p className="mt-1 text-sm text-stone-400">
                  Les nouvelles commandes apparaîtront ici.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {commandes.map(
                  (cmd) => (

                    <article
                      key={cmd.id}
                      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                    >

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <h3 className="font-extrabold">
                            Commande #{cmd.id}
                          </h3>

                          <p className="mt-1 text-sm text-stone-500">
                            {cmd.acheteur_nom ||
                              'Client'}

                            {cmd.acheteur_telephone
                              ? ` • ${cmd.acheteur_telephone}`
                              : ''}
                          </p>

                        </div>

                        <p className="text-xl font-extrabold text-amber-600">
                          {cmd.prix_total} DA
                        </p>

                      </div>

                      <div className="mt-3 flex items-center gap-2">

                        <select
                          value={cmd.statut}
                          disabled={
                            updatingCommandeId ===
                            cmd.id
                          }
                          onChange={(e) =>
                            changeCommandeStatut(
                              cmd.id,
                              e.target.value
                            )
                          }
                          className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
                        >
                          <option value="en_attente">
                            En attente
                          </option>

                          <option value="accepte">
                            Acceptée
                          </option>

                          <option value="en_preparation">
                            En préparation
                          </option>

                          <option value="en_route">
                            En route
                          </option>

                          <option value="livre">
                            Livrée
                          </option>

                          <option value="recupere">
                            Récupérée
                          </option>

                          <option value="annule">
                            Annulée
                          </option>
                        </select>

                        {updatingCommandeId ===
                          cmd.id && (
                          <Loader2
                            size={20}
                            className="animate-spin text-stone-400"
                          />
                        )}

                      </div>

                      {cmd.avec_livraison && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700">
                          <Truck size={15} />

                          Livraison demandée
                        </div>
                      )}

                    </article>

                  )
                )}

              </div>

            )}

          </section>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STATS */}
        {/* ═══════════════════════════════════ */}

        {page === 'stats' && (
          <section>

            <div className="mb-4">

              <h2 className="text-xl font-extrabold">
                Statistiques
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Vue rapide de l'activité de votre commerce.
              </p>

            </div>

            {!stats ? (

              <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-12 text-center">

                <BarChart3
                  size={42}
                  className="mx-auto mb-3 text-stone-300"
                />

                <p className="font-bold">
                  Statistiques indisponibles
                </p>

                <p className="mt-1 text-sm text-stone-400">
                  Réessayez avec le bouton Actualiser.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                <StatCard
                  title="Commandes livrées"
                  value={
                    stats.nb_terminees || 0
                  }
                />

                <StatCard
                  title="Chiffre d'affaires"
                  value={`${stats.chiffre_affaires || 0} DA`}
                  accent
                />

                <StatCard
                  title="Panier moyen"
                  value={`${stats.panier_moyen || 0} DA`}
                />

                <StatCard
                  title="Note moyenne"
                  value={`${Number(
                    stats.note_moyenne || 0
                  ).toFixed(1)} ⭐`}
                />

              </div>

            )}

          </section>
        )}

        {/* ═══════════════════════════════════ */}
        {/* INFOS COMMERCE */}
        {/* ═══════════════════════════════════ */}

        {page === 'infos' && (
          <section className="space-y-5">

            <div>

              <h2 className="text-xl font-extrabold">
                Mon commerce
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Ces informations sont visibles par vos clients.
              </p>

            </div>

            {loadingInfos ? (

              <div className="rounded-2xl border border-stone-200 bg-white py-14 text-center">

                <Loader2
                  size={30}
                  className="mx-auto mb-3 animate-spin text-stone-400"
                />

                <p className="text-sm font-semibold text-stone-500">
                  Chargement des informations...
                </p>

              </div>

            ) : (

              <>

                {/* PHOTO */}

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-stone-100">

                      {imageCommerce ? (
                        <img
                          src={imageCommerce}
                          alt="Commerce"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <Store size={40} />
                        </div>
                      )}

                    </div>

                    <div>

                      <p className="font-extrabold">
                        Photo du commerce
                      </p>

                      <p className="mt-1 text-sm text-stone-500">
                        Cette photo peut être affichée aux clients.
                      </p>

                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600">

                        {uploadingCommerce ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Camera size={16} />
                        )}

                        Modifier la photo

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={
                            uploadingCommerce
                          }
                          onChange={(e) => {
                            const file =
                              e.target.files?.[0]

                            if (file) {
                              uploadCommerceImage(
                                file
                              )
                            }
                          }}
                        />

                      </label>

                    </div>

                  </div>

                </div>

                {/* IDENTITÉ */}

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

                  <div className="mb-4">

                    <h3 className="font-extrabold">
                      Informations générales
                    </h3>

                    <p className="mt-1 text-xs text-stone-400">
                      Nom, catégorie, téléphone et adresse.
                    </p>

                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      label="Nom du commerce"
                      value={commerceNom}
                      onChange={setCommerceNom}
                      placeholder="Nom du commerce"
                    />

                    <Field
                      label="Catégorie"
                      value={commerceCategorie}
                      onChange={setCommerceCategorie}
                      placeholder="Restaurant, épicerie..."
                    />

                    <Field
                      label="Téléphone"
                      value={commerceTelephone}
                      onChange={setCommerceTelephone}
                      placeholder="05 XX XX XX XX"
                      type="tel"
                    />

                    <Field
                      label="Adresse"
                      value={commerceAdresse}
                      onChange={setCommerceAdresse}
                      placeholder="Adresse du commerce"
                    />

                  </div>

                </div>

                {/* HORAIRES */}

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

                  <div className="mb-4 flex items-center gap-2">

                    <Clock
                      size={20}
                      className="text-amber-500"
                    />

                    <div>

                      <h3 className="font-extrabold">
                        Horaires d'ouverture
                      </h3>

                      <p className="mt-1 text-xs text-stone-400">
                        Indiquez quand votre commerce est ouvert.
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-stone-500">
                        Heure d'ouverture
                      </label>

                      <input
                        type="time"
                        value={
                          heureOuverture
                        }
                        onChange={(e) =>
                          setHeureOuverture(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
                      />

                    </div>

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-stone-500">
                        Heure de fermeture
                      </label>

                      <input
                        type="time"
                        value={
                          heureFermeture
                        }
                        onChange={(e) =>
                          setHeureFermeture(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
                      />

                    </div>

                  </div>

                </div>

                {/* LIVRAISON */}

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

                  <div className="mb-4 flex items-center gap-2">

                    <Truck
                      size={20}
                      className="text-amber-500"
                    />

                    <div>

                      <h3 className="font-extrabold">
                        Livraison
                      </h3>

                      <p className="mt-1 text-xs text-stone-400">
                        Configurez les frais de livraison de votre commerce.
                      </p>

                    </div>

                  </div>

                  <label className="flex cursor-pointer items-center gap-3">

                    <input
                      type="checkbox"
                      checked={
                        livraisonGratuite
                      }
                      onChange={(e) =>
                        setLivraisonGratuite(
                          e.target.checked
                        )
                      }
                      className="h-5 w-5 accent-amber-500"
                    />

                    <span className="text-sm font-semibold text-stone-700">
                      Livraison gratuite
                    </span>

                  </label>

                  {!livraisonGratuite && (
                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div>

                        <label className="mb-1.5 block text-xs font-bold text-stone-500">
                          Frais minimum (DA)
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={fraisMin}
                          onChange={(e) =>
                            setFraisMin(
                              e.target.value
                            )
                          }
                          placeholder="100"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
                        />

                      </div>

                      <div>

                        <label className="mb-1.5 block text-xs font-bold text-stone-500">
                          Frais maximum (DA)
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={fraisMax}
                          onChange={(e) =>
                            setFraisMax(
                              e.target.value
                            )
                          }
                          placeholder="200"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
                        />

                      </div>

                    </div>
                  )}

                  <p className="mt-3 text-xs text-stone-400">
                    Le temps de livraison est calculé automatiquement selon la distance.
                  </p>

                </div>

                {/* PRESENTATION */}

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

                  <h3 className="font-extrabold">
                    Présentation du commerce
                  </h3>

                  <p className="mt-1 text-xs text-stone-400">
                    Présentez votre commerce aux clients.
                  </p>

                  <textarea
                    value={presentation}
                    onChange={(e) =>
                      setPresentation(
                        e.target.value
                      )
                    }
                    rows={5}
                    placeholder="Votre histoire, vos spécialités, ce qui vous rend unique..."
                    className="mt-4 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
                  />

                </div>

                {/* MAPS */}

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

                  <div className="mb-4 flex items-start gap-3">

                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                      <MapPin size={20} />
                    </div>

                    <div>

                      <h3 className="font-extrabold">
                        Localisation du commerce
                      </h3>

                      <p className="mt-1 text-xs text-stone-400">
                        Placez le marqueur exactement à l'emplacement de votre commerce.
                      </p>

                    </div>

                  </div>

                  <MapPicker
                    value={position}
                    onChange={setPosition}
                  />

                  {position && (
                    <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-semibold text-emerald-700">

                      ✓ Position enregistrée

                      <div className="mt-1 font-normal">
                        Latitude : {position.lat.toFixed(6)}
                        <br />
                        Longitude : {position.lng.toFixed(6)}
                      </div>

                    </div>
                  )}

                  {position && (
                    <a
                      href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100"
                    >
                      <Navigation size={17} />

                      Ouvrir dans Google Maps
                    </a>
                  )}

                </div>

                {/* SAVE */}

                <button
                  type="button"
                  onClick={saveInfos}
                  disabled={savingInfos}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-4 font-extrabold text-white shadow-lg shadow-amber-100 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {savingInfos ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />

                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check size={19} />

                      Enregistrer les informations
                    </>
                  )}

                </button>

                {/* RÉSUMÉ */}

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 font-extrabold">
                    Résumé du commerce
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">

                    <InfoRow
                      icon={<Store size={17} />}
                      label="Commerce"
                      value={
                        commerceNom ||
                        'Non renseigné'
                      }
                    />

                    <InfoRow
                      icon={<Phone size={17} />}
                      label="Téléphone"
                      value={
                        commerceTelephone ||
                        'Non renseigné'
                      }
                    />

                    <InfoRow
                      icon={<MapPin size={17} />}
                      label="Adresse"
                      value={
                        commerceAdresse ||
                        'Non renseignée'
                      }
                    />

                    <InfoRow
                      icon={<Clock size={17} />}
                      label="Horaires"
                      value={
                        heureOuverture &&
                        heureFermeture
                          ? `${heureOuverture} → ${heureFermeture}`
                          : 'Non renseignés'
                      }
                    />

                    <InfoRow
                      icon={<Truck size={17} />}
                      label="Livraison"
                      value={
                        livraisonGratuite
                          ? 'Gratuite'
                          : fraisMin ||
                            fraisMax
                            ? `${fraisMin || 0} → ${
                                fraisMax || 0
                              } DA`
                            : 'Non renseignée'
                      }
                    />

                    <InfoRow
                      icon={<Navigation size={17} />}
                      label="Maps"
                      value={
                        position
                          ? 'Position enregistrée'
                          : 'Non enregistrée'
                      }
                    />

                  </div>

                </div>

              </>

            )}

          </section>
        )}

      </main>

    </div>
  )
}

// ═══════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-bold text-stone-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
      />

    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">

      <div className="mt-0.5 text-stone-400">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-stone-700">
          {value}
        </p>

      </div>

    </div>
  )
}

function StatCard({
  title,
  value,
  accent = false,
}: {
  title: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-sm">

      <p className="text-xs font-semibold text-stone-500">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-extrabold ${
          accent
            ? 'text-amber-600'
            : 'text-stone-800'
        }`}
      >
        {value}
      </p>

    </div>
  )
}