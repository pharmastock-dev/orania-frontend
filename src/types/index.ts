// ============================================================
// QREEB â€” Types centraux
// AlignÃ©s sur le VRAI backend en production (backend, Postgres +
// Cloudinary + bcrypt, dÃ©ployÃ© sur Render). Certains champs bruts du backend
// (image_url, presentation, nb_avis...) sont normalisÃ©s dans src/api/index.ts
// vers ces noms-ci, pour que le reste de l'app n'ait rien Ã  changer.
// ============================================================

export interface Client {
  id: number;
  nom: string;
  telephone: string;
}

export interface Fournisseur {
  id: number;
  nom: string;
  telephone: string;
  categorie?: string;
  adresse?: string;
  photo?: string | null;
  heure_ouverture?: string | null;
  heure_fermeture?: string | null;
  livraison_gratuite?: boolean | null;
  frais_min?: number | null;
  frais_max?: number | null;
  a_promo?: boolean;
  produits_categories?: string[];
  produits_noms?: string[];
  avis_count?: number;
  note_moyenne?: number | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Admin uniquement (GET /admin/fournisseurs) :
  valide?: boolean;
  actif?: boolean;
  abonnement_fin?: string | null;
}

export interface Produit {
  id: number;
  fournisseur_id: number;
  nom: string;
  prix: number;
  prix_promo?: number | null;
  categorie: string;
  ingredients?: string | null;
  disponible: boolean;
  photo?: string | null;
}

export type ModeReception = "livraison" | "retrait";

// Statuts RÃ‰ELS acceptÃ©s par le vrai backend â€” pas de "en_cours" gÃ©nÃ©rique ni
// d'"annulee" (n'existent pas cÃ´tÃ© serveur). DÃ©part : en_attente (livraison)
// ou non_recupere (retrait) ; en_route posÃ© automatiquement Ã  l'assignation
// d'un livreur ; livre/recupere posÃ©s manuellement par le commerÃ§ant.
export type StatutCommande = "en_attente" | "en_route" | "livre" | "non_recupere" | "recupere" | "annulee";

export interface LigneCommande {
  produit_id?: number;
  nom: string;
  quantite: number;
  prix_unitaire?: number;
}

export interface Commande {
  id: number;
  acheteur_id: number;
  fournisseur_id: number;
  livreur_id?: number | null;
  livreur_nom?: string | null;
  avec_livraison: boolean;
  code_confirmation?: string;
  statut: StatutCommande;
  prix_total: number;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  produits?: LigneCommande[];
  supprime?: boolean;
  // prÃ©sent seulement sur GET /fournisseurs/{id}/commandes :
  acheteur_nom?: string;
  acheteur_telephone?: string;
  commerce_nom?: string;
  commerce_adresse?: string;
  commerce_tel?: string;
  // prÃ©sent seulement sur GET /acheteurs/{id}/commandes :
  fournisseur_nom?: string;
}

export interface Avis {
  id?: number;
  acheteur_id: number;
  acheteur_nom?: string;
  fournisseur_id: number;
  fournisseur_nom?: string;
  note: number;
  commentaire?: string;
  created_at?: string;
}

export interface Livreur {
  id: number;
  fournisseur_id: number;
  nom: string;
  telephone?: string;
}

export interface Statistiques {
  chiffre_affaires: number;
  nb_terminees: number;
  panier_moyen: number;
  note_moyenne: number | null;
  nb_commandes?: number;
  nb_produits?: number;
  nb_promos?: number;
  nb_avis?: number;
}

export type AuteurReclamation = "client" | "fournisseur";

// Le vrai backend n'a pas de champ "sujet" sÃ©parÃ© ni de lien direct vers un
// fournisseur prÃ©cis â€” juste un message libre + coordonnÃ©es de l'auteur.
export interface Reclamation {
  id?: number;
  type_auteur: AuteurReclamation;
  auteur_id?: number | null;
  auteur_nom?: string;
  auteur_telephone?: string;
  message: string;
  traitee?: boolean;
  date_creation?: string;
}

export interface Coordonnees {
  latitude: number;
  longitude: number;
}

// ---- Panier (local, liÃ© Ã  un seul commerce) ----
export interface CartItem {
  produit: Produit;
  quantite: number;
}

export interface Cart {
  fournisseurId: number | null;
  fournisseurNom: string | null;
  items: CartItem[];
}

