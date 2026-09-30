import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Client, Fournisseur, LivreurMarketplace, Cart, Produit, Coordonnees, Supplement } from "../types";
import { readStorage, writeStorage, clearStorage, STORAGE_KEYS } from "../utils/storage";
import { cleCartItem, prixSupplements } from "../utils/cart";

const emptyCart: Cart = { fournisseurId: null, fournisseurNom: null, items: [] };

interface AppContextValue {
  // --- Client ---
  client: Client | null;
  setClient: (client: Client | null) => void;

  // --- Fournisseur connecté (espace commerçant) ---
  fournisseurConnecte: Fournisseur | null;
  setFournisseurConnecte: (f: Fournisseur | null) => void;

  // --- Livreur connecté (espace livreur, marché ouvert) ---
  livreurConnecte: LivreurMarketplace | null;
  setLivreurConnecte: (l: LivreurMarketplace | null) => void;

  // --- Position ---
  position: Coordonnees | null;
  setPosition: (pos: Coordonnees | null) => void;

  // --- Panier ---
  cart: Cart;
  addToCart: (
    produit: Produit,
    fournisseurNom: string,
    quantite?: number,
    note?: string,
    supplements?: Supplement[]
  ) => "ok" | "conflit";
  updateQuantite: (cle: string, quantite: number) => void;
  removeFromCart: (cle: string) => void;
  updateNote: (cle: string, note: string) => void;
  clearCart: () => void;
  replaceCartAvecProduit: (produit: Produit, fournisseurNom: string, supplements?: Supplement[]) => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [client, setClientState] = useState<Client | null>(() => readStorage<Client>(STORAGE_KEYS.client));
  const [fournisseurConnecte, setFournisseurState] = useState<Fournisseur | null>(() =>
    readStorage<Fournisseur>(STORAGE_KEYS.fournisseur)
  );
  const [livreurConnecte, setLivreurState] = useState<LivreurMarketplace | null>(() =>
    readStorage<LivreurMarketplace>(STORAGE_KEYS.livreur)
  );
  const [position, setPositionState] = useState<Coordonnees | null>(() => readStorage<Coordonnees>(STORAGE_KEYS.position));
  const [cart, setCart] = useState<Cart>(() => readStorage<Cart>(STORAGE_KEYS.cart) || emptyCart);

  const setClient = (c: Client | null) => {
    setClientState(c);
    if (c) writeStorage(STORAGE_KEYS.client, c);
    else clearStorage(STORAGE_KEYS.client);
  };

  const setFournisseurConnecte = (f: Fournisseur | null) => {
    setFournisseurState(f);
    if (f) writeStorage(STORAGE_KEYS.fournisseur, f);
    else clearStorage(STORAGE_KEYS.fournisseur);
  };

  const setLivreurConnecte = (l: LivreurMarketplace | null) => {
    setLivreurState(l);
    if (l) writeStorage(STORAGE_KEYS.livreur, l);
    else clearStorage(STORAGE_KEYS.livreur);
  };

  const setPosition = (pos: Coordonnees | null) => {
    setPositionState(pos);
    if (pos) writeStorage(STORAGE_KEYS.position, pos);
  };

  useEffect(() => {
    writeStorage(STORAGE_KEYS.cart, cart);
  }, [cart]);

  function addToCart(
    produit: Produit,
    fournisseurNom: string,
    quantite: number = 1,
    note?: string,
    supplements?: Supplement[]
  ): "ok" | "conflit" {
    if (cart.fournisseurId !== null && cart.fournisseurId !== produit.fournisseur_id) {
      return "conflit";
    }
    const cle = cleCartItem(produit.id, supplements);
    setCart((prev) => {
      const existing = prev.items.find((i) => i.cle === cle);
      const items = existing
        ? prev.items.map((i) =>
            i.cle === cle
              ? { ...i, quantite: i.quantite + quantite, note: note !== undefined ? note : i.note }
              : i
          )
        : [...prev.items, { cle, produit, quantite, note, supplements }];
      return { fournisseurId: produit.fournisseur_id, fournisseurNom, items };
    });
    return "ok";
  }

  function replaceCartAvecProduit(produit: Produit, fournisseurNom: string, supplements?: Supplement[]) {
    setCart({
      fournisseurId: produit.fournisseur_id,
      fournisseurNom,
      items: [{ cle: cleCartItem(produit.id, supplements), produit, quantite: 1, supplements }],
    });
  }

  function updateQuantite(cle: string, quantite: number) {
    setCart((prev) => {
      if (quantite <= 0) {
        const items = prev.items.filter((i) => i.cle !== cle);
        return items.length === 0 ? emptyCart : { ...prev, items };
      }
      return { ...prev, items: prev.items.map((i) => (i.cle === cle ? { ...i, quantite } : i)) };
    });
  }

  function removeFromCart(cle: string) {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.cle !== cle);
      return items.length === 0 ? emptyCart : { ...prev, items };
    });
  }

  function updateNote(cle: string, note: string) {
    setCart((prev) => ({ ...prev, items: prev.items.map((i) => (i.cle === cle ? { ...i, note } : i)) }));
  }

  function clearCart() {
    setCart(emptyCart);
    clearStorage(STORAGE_KEYS.cart);
  }

  const cartTotal = cart.items.reduce(
    (sum, i) => sum + ((i.produit.prix_promo ?? i.produit.prix) + prixSupplements(i.supplements)) * i.quantite,
    0
  );
  const cartCount = cart.items.reduce((sum, i) => sum + i.quantite, 0);

  return (
    <AppContext.Provider
      value={{
        client,
        setClient,
        fournisseurConnecte,
        setFournisseurConnecte,
        livreurConnecte,
        setLivreurConnecte,
        position,
        setPosition,
        cart,
        addToCart,
        updateQuantite,
        removeFromCart,
        updateNote,
        clearCart,
        replaceCartAvecProduit,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return ctx;
}
