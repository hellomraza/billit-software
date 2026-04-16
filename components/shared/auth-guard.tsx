"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for initialization before checking auth
    if (!mounted || !isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      router.push(ROUTES.AUTH_LOGIN);
    }
  }, [isAuthenticated, isInitialized, router, mounted]);

  // Show loading state while initializing
  if (!mounted || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Return null while redirecting
  }

  return <>{children}</>;
}
