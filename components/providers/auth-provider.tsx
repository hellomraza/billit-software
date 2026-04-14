"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("billit_auth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
    setIsInitialized(true);
  }, []);

  const login = () => {
    localStorage.setItem("billit_auth", "true");
    setIsAuthenticated(true);
    router.push(ROUTES.BILLING);
  };

  const logout = () => {
    localStorage.removeItem("billit_auth");
    setIsAuthenticated(false);
    router.push(ROUTES.AUTH_LOGIN);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {isInitialized ? children : <div className="h-screen w-screen flex items-center justify-center">Loading session...</div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
