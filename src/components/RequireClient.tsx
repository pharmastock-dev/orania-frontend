import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function RequireClient({ children }: { children: ReactNode }) {
  const { client } = useApp();
  if (!client) return <Navigate to="/client" replace />;
  return <>{children}</>;
}
