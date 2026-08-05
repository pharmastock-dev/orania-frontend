// src/lib/api.ts

export const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export interface Acheteur {
  id: number
  nom: string
  telephone: string
}

export interface Fournisseur {
  id: number
  nom: string
  telephone: string
  categorie?: string
  adresse?: string
  photo?: string
  heure_ouverture?: string
  heure_fermeture?: string
  temps_livraison: number
  frais_min: number
  frais_max: number
  livraison_gratuite: boolean
  a_promo: boolean
  produits_categories: string[]
  avis_count: number
  note_moyenne: number
}

export interface Produit {
  id: number
  fournisseur_id: number
  nom: string
  prix: number
  prix_promo?: number
  categorie?: string
  photo?: string
  disponible: boolean
}

export interface Commande {
  id: number
  acheteur_id: number
  fournisseur_id: number
  avec_livraison: boolean
  code_confirmation: string
  statut: string
  prix_total: number
  latitude?: number
  longitude?: number
  created_at: string
  acheteur_nom?: string
  acheteur_telephone?: string
  fournisseur_nom?: string
}

export interface Livreur {
  id: number
  fournisseur_id: number
  nom: string
  telephone: string
}

// ==================== CLIENT API ====================

export const clientApi = {
  async stores(): Promise<Fournisseur[]> {
    const res = await fetch(`${API}/fournisseurs`)
    if (!res.ok) return []
    return res.json()
  },

  async storeProduits(fournisseurId: number): Promise<Produit[]> {
    const res = await fetch(`${API}/fournisseurs/${fournisseurId}/produits`)
    if (!res.ok) return []
    return res.json()
  },

  async commander(payload: {
    acheteur_id: number
    fournisseur_id: number
    avec_livraison: boolean
    latitude?: number
    longitude?: number
    produits: { produit_id: number; quantite: number }[]
  }): Promise<{ succes: boolean; code_confirmation: string; commande_id: number }> {
    const res = await fetch(`${API}/commandes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { succes: false, code_confirmation: '', commande_id: 0 }
    return res.json()
  },

  async monAvis(fournisseurId: number, acheteurId: number): Promise<{ note: number; commentaire: string }> {
    const res = await fetch(`${API}/fournisseurs/${fournisseurId}/mon-avis/${acheteurId}`)
    if (!res.ok) return { note: 0, commentaire: '' }
    return res.json()
  },

  async noterAvis(payload: {
    acheteur_id: number
    fournisseur_id: number
    note: number
    commentaire?: string
  }): Promise<{ succes: boolean }> {
    const res = await fetch(`${API}/avis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { succes: false }
    return res.json()
  },

  async historiqueCommandes(acheteurId: number): Promise<Commande[]> {
    const res = await fetch(`${API}/acheteurs/${acheteurId}/commandes`)
    if (!res.ok) return []
    return res.json()
  },

  async login(nom: string, telephone: string): Promise<Acheteur> {
    const res = await fetch(`${API}/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, telephone }),
    })
    if (!res.ok) throw new Error('Login failed')
    return res.json()
  },
}

// ==================== FOURNISSEUR API ====================

export const fournisseurApi = {
  async produits(fournisseurId: number): Promise<Produit[]> {
    const res = await fetch(`${API}/fournisseurs/${fournisseurId}/produits`)
    if (!res.ok) return []
    return res.json()
  },

  async creerProduit(payload: {
    fournisseur_id: number
    nom: string
    prix: number
    prix_promo?: number
    categorie?: string
    disponible: boolean
  }): Promise<Produit> {
    const res = await fetch(`${API}/fournisseurs/${payload.fournisseur_id}/produits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to create product')
    return res.json()
  },

  async modifierProduit(produitId: number, data: any): Promise<{ succes: boolean }> {
    const res = await fetch(`${API}/produits/${produitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return { succes: false }
    return res.json()
  },

  async supprimerProduit(produitId: number): Promise<{ succes: boolean }> {
    const res = await fetch(`${API}/produits/${produitId}`, {
      method: 'DELETE',
    })
    if (!res.ok) return { succes: false }
    return res.json()
  },

  async uploadImage(produitId: number, formData: FormData): Promise<{ succes: boolean; photo: string }> {
    const res = await fetch(`${API}/produits/${produitId}/image`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) return { succes: false, photo: '' }
    return res.json()
  },

  async commandes(fournisseurId: number, terminees: boolean = false): Promise<Commande[]> {
    const res = await fetch(`${API}/fournisseurs/${fournisseurId}/commandes?terminees=${terminees}`)
    if (!res.ok) return []
    return res.json()
  },

  async changerStatut(commandeId: number, statut: string): Promise<{ succes: boolean }> {
    const res = await fetch(`${API}/commandes/${commandeId}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    if (!res.ok) return { succes: false }
    return res.json()
  },

  async statistiques(fournisseurId: number, periode: string = 'tout'): Promise<any> {
    const res = await fetch(`${API}/fournisseurs/${fournisseurId}/statistiques?periode=${periode}`)
    if (!res.ok) return {}
    return res.json()
  },

  async livreurs(fournisseurId: number): Promise<Livreur[]> {
    const res = await fetch(`${API}/fournisseurs/${fournisseurId}/livreurs`)
    if (!res.ok) return []
    return res.json()
  },

  async login(nom: string, telephone: string, categorie?: string, adresse?: string): Promise<any> {
    const res = await fetch(`${API}/fournisseur/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, telephone, categorie, adresse }),
    })
    if (!res.ok) throw new Error('Login failed')
    return res.json()
  },
}