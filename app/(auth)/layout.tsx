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
  const { isAuthenticated, isOnboardingComplete, isInitialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only check auth after both component is mounted AND auth provider is initialized
    if (mounted && isInitialized && isAuthenticated) {
      setIsRedirecting(true);
      if (isOnboardingComplete) {
        router.push(ROUTES.BILLING);
      } else {
        router.push(ROUTES.ONBOARDING_BUSINESS);
      }
    }
  }, [isAuthenticated, isOnboardingComplete, router, mounted, isInitialized]);

  // Show loading state while checking auth
  if (!mounted || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  // Redirect if already authenticated - show loading state while redirecting
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="text-muted-foreground">
          Redirecting to {isOnboardingComplete ? "dashboard" : "onboarding"}...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      {children}
    </div>
  );
}
