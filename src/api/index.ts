// ============================================================
// QREEB — Couche API
// Alignée sur le VRAI backend en production : orania-backend
// (FastAPI + PostgreSQL/Neon + Cloudinary + bcrypt, déployé sur Render).
// Le backend utilise des noms de champs différents des nôtres à certains
// endroits (image_url, presentation, nb_avis...) — on les normalise ici
// pour que le reste de l'app garde des noms cohérents (photo, description,
// avis_count...) sans rien changer ailleurs.
// ============================================================

import { http, BASE_URL, CLE_TOKEN_ADMIN } from "./client";
import type { Fournisseur, Produit, ProduitRecherche, Commande, Avis, Livreur, Statistiques, StatutCommande, Reclamation, LigneCommande, CommandeDisponible, StatutPublicationCommande, HistoriqueLivreurItem, LivreurMarketplaceAdmin } from "../types";

// ---------- Santé ----------
export const checkHealth = () => http.get<{ status: string }>("/health");

// ============================================================
// Normalisation — le backend renvoie image_url/presentation/nb_avis,
// on retravaille ça en photo/description/avis_count une fois pour toutes.
// ============================================================
function normaliserFournisseur(raw: any): Fournisseur {
  return {
    ...raw,
    photo: raw.image_url ?? raw.photo ?? null,
    description: raw.presentation ?? raw.description ?? null,
    avis_count: raw.nb_avis ?? raw.avis_count ?? 0,
    note_moyenne: raw.note_moyenne ?? null,
  };
}

function normaliserProduit(raw: any): Produit {
  return {
    ...raw,
    photo: raw.image_url ?? raw.photo ?? null,
  };
}

// ---------- Authentification commerçant ----------
// IMPORTANT : deux routes bien distinctes côté vrai backend —
// POST /fournisseurs pour CRÉER un compte (nécessite validation admin après),
// POST /login/fournisseur pour SE CONNECTER à un compte déjà validé.
export interface FournisseurSession {
  id: number;
  nom: string;
  telephone?: string;
  adresse?: string;
  categorie?: string;
  heure_ouverture?: string | null;
  heure_fermeture?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  livraison_gratuite?: boolean | null;
  frais_min?: number | null;
  frais_max?: number | null;
  abonnement_fin?: string;
}

export const registerFournisseur = (data: { nom: string; telephone: string; adresse?: string; categorie?: string; latitude?: number; longitude?: number; mot_de_passe: string }) =>
  http.post<{ succes: boolean; message?: string; fournisseur_id?: number }>("/fournisseurs", data);

export const loginFournisseur = async (telephone: string, mot_de_passe: string) => {
  const r = await http.post<any>("/login/fournisseur", { telephone, mot_de_passe });
  if (!r.succes) return { succes: false as const, message: r.message as string };
  const session: FournisseurSession = {
    id: r.fournisseur_id,
    nom: r.nom,
    telephone: r.telephone,
    adresse: r.adresse,
    categorie: r.categorie,
    heure_ouverture: r.heure_ouverture,
    heure_fermeture: r.heure_fermeture,
    description: r.presentation,
    latitude: r.latitude,
    longitude: r.longitude,
    livraison_gratuite: r.livraison_gratuite,
    frais_min: r.frais_min,
    frais_max: r.frais_max,
    abonnement_fin: r.abonnement_fin,
  };
  return { succes: true as const, session, token: r.token as string | undefined };
};

// ---------- Authentification client ----------
// "Trouver ou créer" par téléphone, aucun mot de passe côté client.
export const loginClient = (nom: string, telephone: string) =>
  http.post<{ succes: boolean; id: number; nom: string; telephone: string; token?: string }>("/client/login", { nom, telephone });

// ---------- Fournisseurs (commerces) ----------
// GET /fournisseurs ne renvoie QUE les commerces validés + abonnement actif
// (filtré côté serveur) — inutile de refiltrer côté client.
export const getFournisseurs = async () => {
  const liste = await http.get<any[]>("/fournisseurs");
  return liste.map(normaliserFournisseur);
};

// Recherche de produits à travers tous les commerces (barre de recherche
// client) — pour qu'une recherche type "sushi" ou "poisson" remonte
// directement les produits correspondants, pas seulement les commerces
// dont le nom correspond.
export const rechercherProduits = async (q: string): Promise<ProduitRecherche[]> => {
  const liste = await http.get<any[]>(`/produits/recherche?q=${encodeURIComponent(q)}`);
  return liste.map((raw) => ({ ...raw, photo: raw.image_url ?? raw.photo ?? null }));
};

// Profil complet d'un commerce, pour "Mon commerce" (PAS la fiche publique).
export const getFournisseurInfos = async (fournisseurId: number) => {
  const raw = await http.get<any>(`/fournisseurs/${fournisseurId}/infos`);
  return normaliserFournisseur(raw);
};

export const updateFournisseur = (fournisseurId: number, data: Partial<Fournisseur>) => {
  // On retraduit vers les noms réels attendus par PUT /fournisseurs/{id}/infos.
  const payload: any = { ...data };
  if ("description" in data) {
    payload.presentation = data.description;
    delete payload.description;
  }
  delete payload.photo; // la photo passe uniquement par /fournisseurs/{id}/image
  return http.put<{ succes: boolean; message?: string }>(`/fournisseurs/${fournisseurId}/infos`, payload, "fournisseur");
};

// ---------- Produits ----------
export const getProduits = async (fournisseurId: number) => {
  const liste = await http.get<any[]>(`/fournisseurs/${fournisseurId}/produits`);
  return liste.map(normaliserProduit);
};

// ATTENTION : POST /produits (route À PLAT, PAS nichée sous /fournisseurs/{id}/produits).
export const createProduit = async (fournisseurId: number, data: { nom: string; prix: number; prix_promo?: number | null; categorie: string; ingredients?: string; disponible?: boolean }) => {
  const raw = await http.post<any>("/produits", { fournisseur_id: fournisseurId, ...data });
  return normaliserProduit(raw);
};

export const updateProduit = (produitId: number, data: Partial<Produit>) =>
  http.put<{ succes: boolean; message?: string }>(`/produits/${produitId}`, data);

export const deleteProduit = (produitId: number) => http.del<{ succes: boolean; message?: string }>(`/produits/${produitId}`);

export const uploadProduitImage = (produitId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.postForm<{ succes: boolean; image_url?: string; message?: string }>(`/produits/${produitId}/image`, formData);
};

export const uploadFournisseurImage = (fournisseurId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.postForm<{ succes: boolean; image_url?: string; message?: string }>(`/fournisseurs/${fournisseurId}/image`, formData, "fournisseur");
};

export const resolveImageUrl = (photo?: string | null) => {
  if (!photo) return undefined;
  if (photo.startsWith("http")) return photo;
  return `${BASE_URL}/${photo.replace(/^\/+/, "")}`;
};
// Note pour TS : accepte explicitement `| null` en plus de `| undefined`.
export type ResolveImageUrlInput = string | null | undefined;

// ---------- Commandes ----------
export const createCommande = (data: {
  acheteur_id: number;
  fournisseur_id: number;
  avec_livraison: boolean;
  latitude?: number;
  longitude?: number;
  produits: { produit_id: number; quantite: number; note?: string }[];
}) => http.post<{ id?: number; commande_id?: number; code_confirmation: string; statut?: string; prix_total?: number; succes?: boolean; message?: string }>("/commandes", data);

export const updateCommandeStatut = (commandeId: number, statut: StatutCommande) =>
  http.put<{ succes: boolean }>(`/commandes/${commandeId}/statut`, { statut });

export const assignerLivreur = (commandeId: number, livreurId: number) =>
  http.put<{ succes: boolean; message?: string; statut?: string }>(`/commandes/${commandeId}/assigner`, { livreur_id: livreurId });

// Suppression douce (le vrai backend n'a PAS de DELETE ici) — restaurable.
export const supprimerCommande = (commandeId: number) => http.put<{ succes: boolean }>(`/commandes/${commandeId}/supprimer`);
export const restaurerCommande = (commandeId: number) => http.put<{ succes: boolean }>(`/commandes/${commandeId}/restaurer`);

function normaliserCommandeFournisseur(raw: any): Commande {
  return {
    id: raw.id,
    acheteur_id: raw.acheteur_id,
    fournisseur_id: raw.fournisseur_id,
    livreur_id: raw.livreur_id,
    livreur_nom: raw.livreur_nom,
    avec_livraison: raw.avec_livraison,
    code_confirmation: raw.code_confirmation,
    statut: raw.statut,
    prix_total: Number(raw.prix_total) || 0,
    latitude: raw.acheteur_latitude,
    longitude: raw.acheteur_longitude,
    created_at: raw.date_commande,
    acheteur_nom: raw.acheteur_nom,
    acheteur_telephone: raw.acheteur_telephone,
    commerce_nom: raw.commerce_nom,
    commerce_adresse: raw.commerce_adresse,
    commerce_tel: raw.commerce_tel,
  };
}

// Le vrai backend ne distingue pas "en cours" / "terminées" — seulement
// actives (corbeille=false, par défaut) vs supprimées (corbeille=true).
// On récupère les actives et on filtre nous-mêmes par statut si besoin.
export const getCommandesFournisseur = async (fournisseurId: number) => {
  const liste = await http.get<any[]>(`/fournisseurs/${fournisseurId}/commandes?corbeille=false`, "fournisseur");
  return liste.map(normaliserCommandeFournisseur);
};

export const getCommandesFournisseurCorbeille = async (fournisseurId: number) => {
  const liste = await http.get<any[]>(`/fournisseurs/${fournisseurId}/commandes?corbeille=true`, "fournisseur");
  return liste.map(normaliserCommandeFournisseur);
};

// Détail des produits d'une commande CÔTÉ COMMERÇANT (pas embarqué dans la
// liste ci-dessus, contrairement à la liste acheteur).
export const getProduitsCommande = (commandeId: number) => http.get<LigneCommande[]>(`/commandes/${commandeId}/produits`);

// Côté acheteur, les produits SONT déjà embarqués dans la réponse.
export const getCommandesAcheteur = async (acheteurId: number) => {
  const liste = await http.get<any[]>(`/acheteurs/${acheteurId}/commandes`, "client");
  return liste.map((raw) => ({
    id: raw.id,
    acheteur_id: acheteurId,
    fournisseur_id: raw.fournisseur_id,
    avec_livraison: raw.avec_livraison,
    code_confirmation: raw.code_confirmation,
    statut: raw.statut,
    prix_total: Number(raw.prix_total) || 0,
    created_at: raw.date_commande,
    fournisseur_nom: raw.commerce_nom,
    produits: raw.produits,
  })) as Commande[];
};

// ---------- Avis ----------
// GET .../mon-avis renvoie { existe, id?, note?, commentaire? } — on ramène
// ça à { note, commentaire } avec note=0 par défaut, comme le reste de l'app l'attend.
export const getMonAvis = async (fournisseurId: number, acheteurId: number) => {
  const r = await http.get<{ existe: boolean; id?: number; note?: number; commentaire?: string }>(`/fournisseurs/${fournisseurId}/mon-avis/${acheteurId}`, "client");
  return { note: r.existe ? r.note ?? 0 : 0, commentaire: r.existe ? r.commentaire ?? "" : "" };
};

export const postAvis = (data: Avis) => http.post<{ id: number; note: number; commentaire?: string; modifie: boolean }>("/avis", data);

export const getAvisFournisseur = (fournisseurId: number) => http.get<Avis[]>(`/fournisseurs/${fournisseurId}/avis`);

// Le vrai backend appelle ça "évaluations", pas "avis", pour la liste d'un client.
export const getAvisAcheteur = async (acheteurId: number) => {
  const liste = await http.get<any[]>(`/acheteurs/${acheteurId}/evaluations`, "client");
  return liste.map((r) => ({ id: r.id, note: r.note, commentaire: r.commentaire, fournisseur_id: r.fournisseur_id, fournisseur_nom: r.commerce_nom, acheteur_id: acheteurId })) as Avis[];
};

export const supprimerAvis = (avisId: number) => http.del<{ succes: boolean; message?: string }>(`/avis/${avisId}`);

// ---------- Statistiques ----------
export const getStatistiques = (fournisseurId: number, periode: "jour" | "semaine" | "mois" | "tout" = "tout") =>
  http.get<Statistiques>(`/fournisseurs/${fournisseurId}/statistiques?periode=${periode}`, "fournisseur");

// ---------- Livreurs ----------
export const getLivreurs = (fournisseurId: number) => http.get<Livreur[]>(`/fournisseurs/${fournisseurId}/livreurs`);

// ATTENTION : POST /livreurs (À PLAT, pas nichée sous /fournisseurs/{id}/livreurs).
export const creerLivreur = (fournisseurId: number, data: { nom: string; telephone?: string }) =>
  http.post<Livreur>("/livreurs", { fournisseur_id: fournisseurId, ...data });

export const supprimerLivreur = (livreurId: number) => http.del<{ succes: boolean; message?: string }>(`/livreurs/${livreurId}`, "fournisseur");

// ---------- Admin ----------
// Le vrai backend exige maintenant un jeton (POST /admin/login), plus de
// simple code côté client. Le jeton est stocké en sessionStorage et ajouté
// automatiquement (auth=true) à chaque appel admin.

export const adminLogin = (motDePasse: string) =>
  http.post<{ succes: boolean; token?: string; message?: string }>("/admin/login", { mot_de_passe: motDePasse });

export function stockerTokenAdmin(token: string) {
  sessionStorage.setItem(CLE_TOKEN_ADMIN, token);
}
export function effacerTokenAdmin() {
  sessionStorage.removeItem(CLE_TOKEN_ADMIN);
}
export function estConnecteAdmin() {
  return !!sessionStorage.getItem(CLE_TOKEN_ADMIN);
}

export const getFournisseursAdmin = () => http.get<Fournisseur[]>("/admin/fournisseurs", true);

export const validerFournisseur = (fournisseurId: number) =>
  http.put<{ succes: boolean; abonnement_fin?: string; message?: string }>(`/admin/fournisseurs/${fournisseurId}/valider`, undefined, true);

export const prolongerAbonnement = (fournisseurId: number) =>
  http.put<{ succes: boolean; abonnement_fin?: string; message?: string }>(`/admin/fournisseurs/${fournisseurId}/abonnement`, undefined, true);

// Le vrai backend n'a pas de "suspendre/réactiver" séparés : désactiver met fin
// à l'abonnement immédiatement, réactiver = reprolonger d'un an (même route que ci-dessus).
export const desactiverFournisseur = (fournisseurId: number) =>
  http.put<{ succes: boolean; message?: string }>(`/admin/fournisseurs/${fournisseurId}/desactiver`, undefined, true);

export const reactiverFournisseur = (fournisseurId: number) => prolongerAbonnement(fournisseurId);

// Le vrai backend exige que l'admin choisisse LUI-MÊME le nouveau mot de passe
// (pas de génération auto côté serveur) — l'appelant doit donc le demander avant.
export const reinitialiserMotDePasse = (fournisseurId: number, nouveauMotDePasse: string) =>
  http.put<{ succes: boolean; message?: string }>(`/admin/fournisseurs/${fournisseurId}/motdepasse`, { nouveau_mot_de_passe: nouveauMotDePasse }, true);

// Suppression DÉFINITIVE d'un commerce (ses produits + livreurs aussi).
// Commandes et avis passés restent en base, orphelins, pour l'historique.
export const supprimerFournisseurAdmin = (fournisseurId: number) =>
  http.del<{ succes: boolean; message?: string }>(`/admin/fournisseurs/${fournisseurId}`, true);

// ---------- Réclamations ----------
// Le vrai backend n'a ni "sujet" séparé, ni lien direct vers un fournisseur —
// juste un message libre + les coordonnées de l'auteur.
export const creerReclamation = (data: Reclamation) =>
  http.post<{ succes: boolean; message?: string }>("/reclamations", {
    type_auteur: data.type_auteur,
    auteur_id: data.auteur_id,
    auteur_nom: data.auteur_nom,
    auteur_telephone: data.auteur_telephone,
    message: data.message,
  });

export const getReclamations = () => http.get<Reclamation[]>("/admin/reclamations", true);

export const traiterReclamation = (reclamationId: number) => http.put<{ succes: boolean }>(`/admin/reclamations/${reclamationId}/traitee`, undefined, true);

export const supprimerReclamation = (reclamationId: number) => http.del<{ succes: boolean }>(`/admin/reclamations/${reclamationId}`, true);

// ---------- Notifications push ----------
export const enregistrerTokenAcheteur = (acheteurId: number, deviceToken: string) =>
  http.post<{ succes: boolean }>(`/acheteurs/${acheteurId}/device-token`, { device_token: deviceToken }, "client");

export const enregistrerTokenFournisseur = (fournisseurId: number, deviceToken: string) =>
  http.post<{ succes: boolean }>(`/fournisseurs/${fournisseurId}/device-token`, { device_token: deviceToken }, "fournisseur");

// ---------- Espace livreur (marché ouvert) ----------
export const inscriptionLivreurMarketplace = (nom: string, telephone: string, mot_de_passe: string) =>
  http.post<{ succes: boolean; id?: number; nom?: string; telephone?: string; message?: string }>(
    "/livreurs-marketplace/inscription",
    { nom, telephone, mot_de_passe }
  );

export const connexionLivreurMarketplace = (telephone: string, mot_de_passe: string) =>
  http.post<{ succes: boolean; id?: number; nom?: string; telephone?: string; message?: string; en_attente?: boolean; token?: string }>(
    "/livreurs-marketplace/connexion",
    { telephone, mot_de_passe }
  );

export const majPositionLivreur = (livreurId: number, latitude: number, longitude: number) =>
  http.put<{ succes: boolean }>(`/livreurs-marketplace/${livreurId}/position`, { latitude, longitude }, "livreur");

export const majStatutLivreur = (livreurId: number, en_ligne: boolean) =>
  http.put<{ succes: boolean }>(`/livreurs-marketplace/${livreurId}/statut`, { en_ligne }, "livreur");

export const enregistrerTokenLivreur = (livreurId: number, device_token: string) =>
  http.post<{ succes: boolean }>(`/livreurs-marketplace/${livreurId}/token`, { device_token }, "livreur");

export const getCommandesDisponibles = (livreurId: number, latitude: number, longitude: number) =>
  http.get<CommandeDisponible[]>(`/livreurs-marketplace/${livreurId}/commandes-disponibles?latitude=${latitude}&longitude=${longitude}`, "livreur");

export const getCommandeActiveLivreur = (livreurId: number) =>
  http.get<CommandeDisponible | null>(`/livreurs-marketplace/${livreurId}/commande-active`, "livreur");

export const publierCommande = (commandeId: number) =>
  http.post<{ succes: boolean; message: string }>(`/commandes/${commandeId}/publier`);

export const accepterCommandeMarketplace = (commandeId: number, livreurId: number) =>
  http.post<{ succes: boolean; message: string }>(`/commandes/${commandeId}/accepter-marketplace`, { livreur_id: livreurId });

export const refuserCommandeMarketplace = (commandeId: number) =>
  http.post<{ succes: boolean; message: string }>(`/commandes/${commandeId}/refuser-marketplace`);

export const marquerCommandeLivree = (commandeId: number) =>
  http.post<{ succes: boolean; message: string }>(`/commandes/${commandeId}/marquer-livree`);

export const marquerCommandeNonLivree = (commandeId: number) =>
  http.post<{ succes: boolean; message: string }>(`/commandes/${commandeId}/marquer-non-livree`);

export const getHistoriqueLivreur = (livreurId: number) =>
  http.get<HistoriqueLivreurItem[]>(`/livreurs-marketplace/${livreurId}/historique`, "livreur");

// ---------- Admin — gestion des livreurs marché ouvert ----------
export const adminListeLivreursMarketplace = () =>
  http.get<LivreurMarketplaceAdmin[]>("/admin/livreurs-marketplace", true);

export const adminValiderLivreurMarketplace = (livreurId: number) =>
  http.put<{ succes: boolean; message: string; abonnement_fin?: string }>(`/admin/livreurs-marketplace/${livreurId}/valider`, undefined, true);

export const adminProlongerAbonnementLivreur = (livreurId: number) =>
  http.put<{ succes: boolean; message: string; abonnement_fin?: string }>(`/admin/livreurs-marketplace/${livreurId}/abonnement`, undefined, true);

export const adminSupprimerLivreurMarketplace = (livreurId: number) =>
  http.del<{ succes: boolean; message: string }>(`/admin/livreurs-marketplace/${livreurId}`, true);

export const getStatutPublicationCommande = (commandeId: number) =>
  http.get<StatutPublicationCommande>(`/commandes/${commandeId}/statut-publication`);
