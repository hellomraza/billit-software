"use client";

import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface TenantSettings {
  businessName: string;
  businessAbbreviation: string;
  outletName: string;
  outletAbbreviation: string;
  gstNumber: string;
  isGstEnabled: boolean;
  defaultGstRate: number;
  currency: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  isInitialized: boolean;
  tenantSettings: TenantSettings;
  login: () => void;
  logout: () => void;
  completeOnboardingStep: (
    step: "business" | "outlet" | "gst",
    data: Record<string, string>,
  ) => void;
  finishOnboarding: () => void;
  updateTenantSettings: (settings: Partial<TenantSettings>) => void;
}

const DEFAULT_TENANT: TenantSettings = {
  businessName: "",
  businessAbbreviation: "",
  outletName: "",
  outletAbbreviation: "",
  gstNumber: "",
  isGstEnabled: true,
  defaultGstRate: 18,
  currency: "INR",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboardingComplete, setIsOnboardingComplete] =
    useState<boolean>(false);
  const [tenantSettings, setTenantSettings] =
    useState<TenantSettings>(DEFAULT_TENANT);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("billit_auth");
    const onboarded = localStorage.getItem("billit_onboarding_complete");
    const savedSettings = localStorage.getItem("billit_tenant_settings");

    if (stored === "true") {
      setIsAuthenticated(true);
    }
    if (onboarded === "true") {
      setIsOnboardingComplete(true);
    }
    if (savedSettings) {
      try {
        setTenantSettings({ ...DEFAULT_TENANT, ...JSON.parse(savedSettings) });
      } catch {
        /* ignore corrupt data */
      }
    }
    setIsInitialized(true);
  }, []);

  const login = useCallback(() => {
    localStorage.setItem("billit_auth", "true");
    // Set auth cookie with proper attributes
    document.cookie = "billit_auth=true; path=/; max-age=2592000; SameSite=Lax";
    setIsAuthenticated(true);
    // Layout will handle redirect based on isAuthenticated state change
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("billit_auth");
    // Clear auth cookie with proper attributes
    document.cookie = "billit_auth=; path=/; max-age=0; SameSite=Lax";
    setIsAuthenticated(false);
    // Proxy and layout will handle redirect based on isAuthenticated state change
  }, []);

  const completeOnboardingStep = useCallback(
    (step: "business" | "outlet" | "gst", data: Record<string, string>) => {
      const key = `billit_onboarding_${step}`;
      localStorage.setItem(key, JSON.stringify(data));
      // Set onboarding step cookie with proper attributes
      document.cookie = `billit_onboarding_${step}=true; path=/; max-age=2592000; SameSite=Lax`;

      // Merge into tenant settings
      setTenantSettings((prev) => {
        const updated = { ...prev };
        if (step === "business") {
          updated.businessName = data.businessName || prev.businessName;
          updated.businessAbbreviation =
            data.businessAbbreviation || prev.businessAbbreviation;
        } else if (step === "outlet") {
          updated.outletName = data.outletName || prev.outletName;
          updated.outletAbbreviation =
            data.outletAbbreviation || prev.outletAbbreviation;
        } else if (step === "gst") {
          updated.gstNumber = data.gstNumber || prev.gstNumber;
        }
        localStorage.setItem("billit_tenant_settings", JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  const finishOnboarding = useCallback(() => {
    localStorage.setItem("billit_onboarding_complete", "true");
    // Set onboarding complete cookie with proper attributes
    document.cookie =
      "billit_onboarding_complete=true; path=/; max-age=2592000; SameSite=Lax";
    setIsOnboardingComplete(true);
    // OnboardingGuard or auth-layout will handle redirect based on state changes
  }, []);

  const updateTenantSettings = useCallback(
    (settings: Partial<TenantSettings>) => {
      setTenantSettings((prev) => {
        const updated = { ...prev, ...settings };
        localStorage.setItem("billit_tenant_settings", JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isOnboardingComplete,
        isInitialized,
        tenantSettings,
        login,
        logout,
        completeOnboardingStep,
        finishOnboarding,
        updateTenantSettings,
      }}
    >
      {children}
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
