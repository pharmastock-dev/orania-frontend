import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import RequireClient from "./components/RequireClient";

import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";

import ClientLoginPage from "./pages/ClientLoginPage";
import ClientHomePage from "./pages/ClientHomePage";
import StorePage from "./pages/StorePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderPage from "./pages/OrderPage";
import AccountPage from "./pages/AccountPage";

import FournisseurLoginPage from "./pages/FournisseurLoginPage";
import FournisseurDashboard from "./pages/FournisseurDashboard";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";

import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route path="/client" element={<ClientLoginPage />} />
            <Route path="/client/accueil" element={<RequireClient><ClientHomePage /></RequireClient>} />
            <Route path="/commerce/:id" element={<StorePage />} />
            <Route path="/panier" element={<RequireClient><CartPage /></RequireClient>} />
            <Route path="/commander" element={<RequireClient><CheckoutPage /></RequireClient>} />
            <Route path="/commande/:id" element={<RequireClient><OrderPage /></RequireClient>} />
            <Route path="/compte" element={<RequireClient><AccountPage /></RequireClient>} />

            <Route path="/commercant" element={<FournisseurLoginPage />} />
            <Route path="/commercant/dashboard" element={<FournisseurDashboard />} />

            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
