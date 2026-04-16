"use client";

import React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      if (isOnboardingComplete) {
        router.push(ROUTES.BILLING);
      } else {
        router.push(ROUTES.ONBOARDING_BUSINESS);
      }
    }
  }, [isAuthenticated, isOnboardingComplete, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      {children}
    </div>
  );
}
