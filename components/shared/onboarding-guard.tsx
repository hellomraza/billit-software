"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/routes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboardingComplete, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for initialization before checking auth
    if (!mounted || !isInitialized) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push(ROUTES.AUTH_LOGIN);
      return;
    }

    // If onboarding is complete, redirect to billing
    if (isOnboardingComplete) {
      router.push(ROUTES.BILLING);
      return;
    }

    // Enforce step progression: user must complete steps in order
    const isBusinessStep = pathname === ROUTES.ONBOARDING_BUSINESS;
    const isOutletStep = pathname === ROUTES.ONBOARDING_OUTLET;
    const isGstStep = pathname === ROUTES.ONBOARDING_GST;

    // Check if business step is completed
    const businessCompleted = localStorage.getItem(
      "billit_onboarding_business",
    );
    // Check if outlet step is completed
    const outletCompleted = localStorage.getItem("billit_onboarding_outlet");

    // Cannot access outlet step if business is not completed
    if (isOutletStep && !businessCompleted) {
      router.push(ROUTES.ONBOARDING_BUSINESS);
      return;
    }

    // Cannot access GST step if outlet is not completed
    if (isGstStep && !outletCompleted) {
      router.push(ROUTES.ONBOARDING_OUTLET);
      return;
    }
  }, [
    isAuthenticated,
    isOnboardingComplete,
    router,
    pathname,
    mounted,
    isInitialized,
  ]);

  // Show loading state while initializing
  if (!mounted || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show redirecting state while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <div className="text-muted-foreground">Redirecting to login...</div>
      </div>
    );
  }

  if (isOnboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <div className="text-muted-foreground">Redirecting to dashboard...</div>
      </div>
    );
  }

  return <>{children}</>;
}
