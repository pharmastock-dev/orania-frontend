// ─── API centralisée ───────────────────────────────────────────────────────
// Tous les appels au backend FastAPI passent par ici. Aligné sur main.py.

export const API = 'https://orania-backend.onrender.com'

async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let msg = 'Erreur serveur'
    try {
      const data = await res.json()
      msg = data.detail || data.message || msg
    } catch {}
    throw new Error(msg)
  }
  return res.json()
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Acheteur { id: number; nom: string; telephone: string }

export interface Fournisseur {
  id: number
  nom: string
  categorie: string
  photo?: string | null
  adresse?: string | null
  telephone?: string | null
  presentation?: string | null
  note_moyenne?: number | null
  nb_avis?: number
  latitude?: number | null
  longitude?: number | null
  heure_ouverture?: string | null
  heure_fermeture?: string | null
  produits_noms?: string[]
  produits_categories?: string[]
}

export interface Produit {
  id: number
  nom: string
  prix: number
  categorie?: string | null
  ingredients?: string | null
  image_url?: string | null
  disponible: boolean
  fournisseur_id?: number
}

export interface Livreur {
  id: number
  nom: string
  telephone?: string | null
  fournisseur_id?: number
}

export interface Commande {
  id: number
  statut: string
  prix_total: number
  avec_livraison: boolean
  code_confirmation?: string
  date_commande: string
  livreur_id?: number | null
  livreur_nom?: string | null
  acheteur_nom?: string
  acheteur_telephone?: string | null
  commerce_nom?: string | null
  commerce_adresse?: string | null
  commerce_tel?: string | null
  acheteur_latitude?: number | null
  acheteur_longitude?: number | null
}

export interface LigneCommande { nom: string; quantite: number; prix_unitaire: number }
export interface Avis { id: number; note: number; commentaire?: string; acheteur_id?: number; acheteur_nom: string }
export interface Evaluation { id?: number; note: number; commentaire?: string; nom: string }

// Fournisseur vu par l'admin
export interface FournisseurAdmin {
  id: number
  nom: string
  telephone: string
  adresse?: string | null
  categorie?: string | null
  valide: boolean
  abonnement_fin?: string | null
  actif: boolean
}

// ─── CLIENT ──────────────────────────────────────────────────────────────────

export const clientApi = {
  login: (nom: string, telephone: string): Promise<Acheteur> =>
    req('/acheteurs/login', { method: 'POST', body: JSON.stringify({ nom, telephone }) }),
  fournisseurs: (): Promise<Fournisseur[]> => req('/fournisseurs'),
  produits: (fid: number): Promise<Produit[]> => req(`/fournisseurs/${fid}/produits`),
  avis: (fid: number): Promise<Avis[]> => req(`/fournisseurs/${fid}/avis`),
  commander: (payload: {
    acheteur_id: number
    fournisseur_id: number
    avec_livraison: boolean
    latitude?: number | null
    longitude?: number | null
    produits: { produit_id: number; quantite: number }[]
  }): Promise<Commande> =>
    req('/commandes', { method: 'POST', body: JSON.stringify(payload) }),
  noterAvis: (payload: {
    acheteur_id: number
    fournisseur_id: number
    note: number
    commentaire: string | null
  }): Promise<any> => req('/avis', { method: 'POST', body: JSON.stringify(payload) }),
  supprimerMonAvis: (eid: number): Promise<any> => req(`/avis/${eid}`, { method: 'DELETE' }),
  monAvis: (fid: number, aid: number): Promise<{ existe: boolean; id?: number; note?: number; commentaire?: string }> =>
    req(`/fournisseurs/${fid}/mon-avis/${aid}`),
}

// ─── FOURNISSEUR ───────────────────────────────────────────────────────────────

export interface LoginFournisseurResult {
  succes: boolean
  message: string
  fournisseur_id?: number
  nom?: string
  telephone?: string
  adresse?: string
  categorie?: string
  heure_ouverture?: string | null
  heure_fermeture?: string | null
  presentation?: string | null
  abonnement_fin?: string
}

export interface RegisterResult {
  succes: boolean
  message: string
  fournisseur_id?: number
}

export const fournisseurApi = {
  login: (telephone: string, mot_de_passe: string): Promise<LoginFournisseurResult> =>
    req('/login/fournisseur', { method: 'POST', body: JSON.stringify({ telephone, mot_de_passe }) }),
  register: (payload: {
    nom: string; telephone: string; adresse: string; categorie: string
    latitude?: number | null; longitude?: number | null; mot_de_passe: string
  }): Promise<RegisterResult> => req('/fournisseurs', { method: 'POST', body: JSON.stringify(payload) }),
  produits: (fid: number): Promise<Produit[]> => req(`/fournisseurs/${fid}/produits`),
  ajouterProduit: (payload: {
    fournisseur_id: number; nom: string; prix: number; categorie?: string; ingredients?: string; disponible: boolean
  }): Promise<any> => req('/produits', { method: 'POST', body: JSON.stringify(payload) }),
  modifierProduit: (pid: number, payload: { nom?: string; prix?: number; categorie?: string; ingredients?: string; disponible?: boolean }): Promise<any> =>
    req(`/produits/${pid}`, { method: 'PUT', body: JSON.stringify(payload) }),
  supprimerProduit: (pid: number): Promise<any> => req(`/produits/${pid}`, { method: 'DELETE' }),
  livreurs: (fid: number): Promise<Livreur[]> => req(`/fournisseurs/${fid}/livreurs`),
  ajouterLivreur: (payload: { fournisseur_id: number; nom: string; telephone?: string }): Promise<any> =>
    req('/livreurs', { method: 'POST', body: JSON.stringify(payload) }),
  supprimerLivreur: (lid: number): Promise<any> => req(`/livreurs/${lid}`, { method: 'DELETE' }),
  commandes: (fid: number, corbeille = false): Promise<Commande[]> =>
    req(`/fournisseurs/${fid}/commandes?corbeille=${corbeille}`),
  produitsCommande: (cid: number): Promise<LigneCommande[]> => req(`/commandes/${cid}/produits`),
  assignerLivreur: (cid: number, livreur_id: number): Promise<any> =>
    req(`/commandes/${cid}/assigner`, { method: 'PUT', body: JSON.stringify({ livreur_id }) }),
  changerStatut: (cid: number, statut: string): Promise<any> =>
    req(`/commandes/${cid}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) }),
  supprimerCommande: (cid: number): Promise<any> => req(`/commandes/${cid}/supprimer`, { method: 'PUT' }),
  restaurerCommande: (cid: number): Promise<any> => req(`/commandes/${cid}/restaurer`, { method: 'PUT' }),
  note: (fid: number): Promise<{ moyenne: number; nombre: number }> => req(`/fournisseurs/${fid}/note`),
  modifierInfos: (fid: number, payload: { nom?: string; categorie?: string; adresse?: string; telephone?: string; heure_ouverture?: string; heure_fermeture?: string; presentation?: string }): Promise<any> =>
    req(`/fournisseurs/${fid}/infos`, { method: 'PUT', body: JSON.stringify(payload) }),
  evaluations: (fid: number): Promise<Evaluation[]> => req(`/fournisseurs/${fid}/evaluations`),
  supprimerAvis: (eid: number): Promise<any> => req(`/evaluations/${eid}`, { method: 'DELETE' }),
  uploadImageProduit: async (pid: number, file: File): Promise<any> => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`${API}/produits/${pid}/image`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Upload échoué')
    return res.json()
  },
  uploadImageMagasin: async (fid: number, file: File): Promise<any> => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`${API}/fournisseurs/${fid}/image`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Upload échoué')
    return res.json()
  },
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export interface Reclamation {
  id: number
  type_auteur: string
  auteur_id?: number | null
  auteur_nom?: string | null
  auteur_telephone?: string | null
  message: string
  traitee: boolean
  date_creation: string
}

export const reclamationApi = {
  envoyer: (payload: { type_auteur: string; auteur_id?: number; auteur_nom?: string; auteur_telephone?: string; message: string }): Promise<any> =>
    req('/reclamations', { method: 'POST', body: JSON.stringify(payload) }),
}

export const adminApi = {
  fournisseurs: (): Promise<FournisseurAdmin[]> => req('/admin/fournisseurs'),
  reclamations: (): Promise<Reclamation[]> => req('/admin/reclamations'),
  marquerTraitee: (id: number): Promise<any> => req(`/admin/reclamations/${id}/traitee`, { method: 'PUT' }),
  supprimerReclamation: (id: number): Promise<any> => req(`/admin/reclamations/${id}`, { method: 'DELETE' }),
  valider: (fid: number): Promise<any> =>
    req(`/admin/fournisseurs/${fid}/valider`, { method: 'PUT' }),
  activerAbonnement: (fid: number): Promise<any> =>
    req(`/admin/fournisseurs/${fid}/abonnement`, { method: 'PUT' }),
  desactiver: (fid: number): Promise<any> =>
    req(`/admin/fournisseurs/${fid}/desactiver`, { method: 'PUT' }),
  resetMotDePasse: (fid: number, nouveau: string): Promise<any> =>
    req(`/admin/fournisseurs/${fid}/motdepasse`, {
      method: 'PUT', body: JSON.stringify({ nouveau_mot_de_passe: nouveau }),
    }),
}
