"use client";

import { forgotPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, {
    error: "",
    success: "",
  });

  console.log("ForgotPasswordForm state:", state);

  // Dev: If resetToken is present, redirect to reset password page
  useEffect(() => {
    if ("resetToken" in state && state.resetToken) {
      router.push(`/reset-password?token=${state.resetToken}`);
    }
  }, [state, router]);

  // Show success state when action succeeds (production)
  const isSuccess =
    !!state.success && !("resetToken" in state && state.resetToken);

  if (isSuccess) {
    return (
      <div className="w-full space-y-4 text-center">
        <div className="rounded-md bg-success/10 p-4">
          <p className="text-sm text-success font-medium mb-2">
            Check your email
          </p>
          <p className="text-sm text-muted-foreground">{state.success}</p>
        </div>

        <p className="text-sm text-muted-foreground">
          Didn't receive an email? Check your spam folder or{" "}
          <button
            onClick={() => window.location.reload()}
            className="text-primary underline hover:no-underline"
          >
            try again
          </button>
        </p>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Back to Login
        </Button>
      </div>
    );
  }

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
          aria-invalid={"error" in state && !!state.error}
        />
        <p className="text-xs text-muted-foreground">
          Enter the email address associated with your account.
        </p>
      </div>

      {/* Error Message (only for validation errors, not "email not found") */}
      {"error" in state && state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending reset link..." : "Send Reset Link"}
      </Button>

      {/* Back to Login Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-sm text-primary hover:underline"
        >
          Back to Login
        </button>
      </div>
    </form>
  );
}
