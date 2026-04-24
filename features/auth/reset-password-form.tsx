"use client";

import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(resetPasswordAction, {
    error: "",
    success: "",
  });

  // Show success state when action succeeds
  const isSuccess = !!state.success;

  if (isSuccess) {
    return (
      <div className="w-full space-y-4 text-center">
        <div className="rounded-md bg-success/10 p-4">
          <p className="text-sm text-success font-medium mb-2">
            Password reset successful
          </p>
          <p className="text-sm text-muted-foreground">{state.success}</p>
        </div>

        <Button className="w-full" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-4">
      {/* Hidden token field */}
      <input type="hidden" name="token" value={token} />

      {/* New Password Field */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="••••••••"
          required
          disabled={isPending}
          aria-invalid={"error" in state && !!state.error}
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters with letters and numbers.
        </p>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          disabled={isPending}
          aria-invalid={"error" in state && !!state.error}
        />
      </div>

      {/* Error Message */}
      {"error" in state && state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Resetting password..." : "Reset Password"}
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
