"use client";
import { Tenant } from "@/lib/types/api";

// Call this immediately after successful login/signup
export function saveAuthSession(accessToken: string, tenant: Tenant) {
  // Save to localStorage for client axios
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("tenant", JSON.stringify(tenant));

  // Save to cookies for server axios (JS-accessible cookie)
  document.cookie = `access_token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  document.cookie = `tenant_id=${tenant._id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function completeOnboarding() {
  localStorage.setItem("billit_onboarding_complete", "true");
  // Set onboarding complete cookie with proper attributes
  document.cookie =
    "billit_onboarding_complete=true; path=/; max-age=2592000; SameSite=Lax";
}

export function clearAuthSession() {
  // Clear auth tokens
  localStorage.removeItem("access_token");
  localStorage.removeItem("tenant");
  document.cookie = "access_token=; path=/; max-age=0";
  document.cookie = "tenant_id=; path=/; max-age=0";
  document.cookie = "outlet_id=; path=/; max-age=0";

  // Clear onboarding data
  localStorage.removeItem("billit_onboarding_complete");
  localStorage.removeItem("billit_tenant_settings");
  localStorage.removeItem("billit_onboarding_business");
  localStorage.removeItem("billit_onboarding_outlet");
  localStorage.removeItem("billit_onboarding_gst");
  document.cookie = "billit_onboarding_complete=; path=/; max-age=0";
  document.cookie = "billit_onboarding_business=; path=/; max-age=0";
  document.cookie = "billit_onboarding_outlet=; path=/; max-age=0";
  document.cookie = "billit_onboarding_gst=; path=/; max-age=0";

  // Clear UI state filters and preferences
  localStorage.removeItem("billit_invoice_filters");
}

export function getStoredTenant(): Tenant | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("tenant");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredOutletId(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )outlet_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getStoredTenantId(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )tenant_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
