"use client";

import { ensureOutletIdAction } from "@/actions/outlet";
import { useEffect, useState } from "react";

/**
 * Client component that ensures outlet_id is set in cookies before rendering children
 * Called on mount to bootstrap outlet context for dashboard access
 * Shows loading state while checking/setting outlet_id
 */
export function OutletBootstrap({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    ensureOutletIdAction()
      .then(outletId => {
        localStorage.setItem("outlet_id", outletId ?? ""); // Cache in localStorage for client access
        setIsReady(true);
      })
      .catch((error) => {
        console.error("Failed to ensure outlet_id:", error);
        setIsReady(true); // Still render even if outlet fetch fails
      });
  }, []);

  if (!isReady) {
    return null; // Don't render until outlet is checked/set
  }

  return <>{children}</>;
}
