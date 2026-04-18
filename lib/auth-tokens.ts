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

export function clearAuthSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("tenant");
  document.cookie = "access_token=; path=/; max-age=0";
  document.cookie = "tenant_id=; path=/; max-age=0";
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
