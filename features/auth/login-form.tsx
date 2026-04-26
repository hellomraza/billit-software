"use client";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding, saveAuthSession } from "@/lib/auth-tokens";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: "",
    success: "",
  });

  useEffect(() => {
    if (
      state.success &&
      "accessToken" in state &&
      "tenant" in state &&
      state.accessToken &&
      state.tenant
    ) {
      // Save auth session to localStorage and cookies
      saveAuthSession(state.accessToken, state.tenant);

      // Check onboarding status and redirect accordingly
      if (!state.tenant?.onboardingComplete) {
        router.push("/onboarding/business");
      } else {
        completeOnboarding();
        router.push("/");
      }
    }
  }, [state, router]);

  return (
    <form action={formAction} className="w-full space-y-4">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={isPending}
          aria-invalid={!!state.error}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          disabled={isPending}
          aria-invalid={!!state.error}
        />
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Logging in..." : "Log In"}
      </Button>
    </form>
  );
}
