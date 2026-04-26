"use client";

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
  isOnboardingComplete: boolean;
  isInitialized: boolean;
  tenantSettings: TenantSettings;
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
  const [isOnboardingComplete, setIsOnboardingComplete] =
    useState<boolean>(false);
  const [tenantSettings, setTenantSettings] =
    useState<TenantSettings>(DEFAULT_TENANT);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("billit_onboarding_complete");
    const savedSettings = localStorage.getItem("billit_tenant_settings");

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
        isOnboardingComplete,
        isInitialized,
        tenantSettings,
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
