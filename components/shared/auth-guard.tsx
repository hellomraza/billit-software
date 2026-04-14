"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/routes";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.AUTH_LOGIN);
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Return null while redirecting
  }

  return <>{children}</>;
}
