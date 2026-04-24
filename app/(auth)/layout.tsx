"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOnboardingComplete, isInitialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only check auth after both component is mounted AND auth provider is initialized
    if (mounted && isInitialized) {
      if (isOnboardingComplete) {
        router.push(ROUTES.BILLING);
      } else {
        router.push(ROUTES.ONBOARDING_BUSINESS);
      }
    }
  }, [isOnboardingComplete, router, mounted, isInitialized]);

  // Show loading state while checking auth
  if (!mounted || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      {children}
    </div>
  );
}
