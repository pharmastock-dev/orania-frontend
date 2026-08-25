// ============================================================
// QREEB — Types centraux
// Alignés sur le VRAI backend en production (orania-backend, Postgres +
// Cloudinary + bcrypt, déployé sur Render). Certains champs bruts du backend
// (image_url, presentation, nb_avis...) sont normalisés dans src/api/index.ts
// vers ces noms-ci, pour que le reste de l'app n'ait rien à changer.
// ============================================================

export interface Client {
  id: number;
  nom: string;
  telephone: string;
}

// Livreur du marché ouvert — compte indépendant du système de livreurs
// privés par commerce (Livreur, plus bas), peut accepter des commandes de
// n'importe quel commerçant.
export interface LivreurMarketplace {
  id: number;
  nom: string;
  telephone: string;
}

export interface CommandeDisponible {
  id: number;
  prix_total: number;
  avec_livraison: boolean;
  date_commande: string;
  statut?: StatutCommande;
  client_nom: string;
  client_telephone: string;
  commercant_nom: string;
  commercant_telephone: string;
  commercant_adresse: string | null;
  distance_km: number;
  distance_commerce_km?: number | null;
  distance_client_km?: number | null;
}

export interface HistoriqueLivreurItem {
  id: number;
  prix_total: number;
  date_commande: string;
  client_nom: string;
  commercant_nom: string;
}

export interface LivreurMarketplaceAdmin {
  id: number;
  nom: string;
  telephone: string;
  valide: boolean;
  en_ligne: boolean;
  date_creation: string | null;
  abonnement_fin: string | null;
}

export interface StatutPublicationCommande {
  succes: boolean;
  statut_publication: string | null;
  livreur: {
    id: number;
    nom: string;
    telephone: string;
    distance_km: number | null;
  } | null;
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
  date_creation?: string | null;
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

// Résultat de recherche produit (barre de recherche client) — un Produit
// enrichi du nom du commerce qui le vend, pour affichage + navigation directe.
export interface ProduitRecherche extends Produit {
  fournisseur_nom: string;
  fournisseur_categorie?: string;
}

export type ModeReception = "livraison" | "retrait";

// Statuts RÉELS acceptés par le vrai backend — pas de "en_cours" générique ni
// d'"annulee" (n'existent pas côté serveur). Départ : en_attente (livraison)
// ou non_recupere (retrait) ; en_route posé automatiquement à l'assignation
// d'un livreur ; livre/recupere posés manuellement par le commerçant.
export type StatutCommande = "en_attente" | "en_route" | "livre" | "non_recupere" | "recupere" | "annulee";

export interface LigneCommande {
  produit_id?: number;
  nom: string;
  quantite: number;
  prix_unitaire?: number;
  note?: string | null;
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
  // présent seulement sur GET /fournisseurs/{id}/commandes :
  acheteur_nom?: string;
  acheteur_telephone?: string;
  commerce_nom?: string;
  commerce_adresse?: string;
  commerce_tel?: string;
  // présent seulement sur GET /acheteurs/{id}/commandes :
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

// Le vrai backend n'a pas de champ "sujet" séparé ni de lien direct vers un
// fournisseur précis — juste un message libre + coordonnées de l'auteur.
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

// ---- Panier (local, lié à un seul commerce) ----
export interface CartItem {
  produit: Produit;
  quantite: number;
  note?: string;
}

export interface Cart {
  fournisseurId: number | null;
  fournisseurNom: string | null;
  items: CartItem[];
}

// Résultat renvoyé par QREEB Assistant (/assistant/recherche) — un produit
// avec son score de mérite et sa phrase d'explication générée par gabarit
// (pas par IA — voir main.py pour le détail du calcul).
export interface AssistantResultat {
  id: number;
  fournisseur_id: number;
  nom: string;
  prix: number;
  prix_promo?: number | null;
  image_url?: string | null;
  categorie?: string;
  ingredients?: string | null;
  fournisseur_nom: string;
  fournisseur_categorie?: string;
  fournisseur_adresse?: string | null;
  prix_groupe: number;
  distance_km?: number | null;
  note_moyenne?: number | null;
  score: number;
  phrase: string;
}

export interface CriteresAssistant {
  envie: string;
  budget_max?: number | null;
  personnes: number;
  latitude?: number | null;
  longitude?: number | null;
  mode: "livraison" | "retrait";
}
