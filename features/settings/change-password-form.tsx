"use client";

import { changePasswordAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, {
    error: "",
    success: "",
  });

  // Show success state when action succeeds
  const isSuccess = !!state.success;

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-success/10 p-4">
          <p className="text-sm text-success font-medium mb-1">
            Password changed successfully
          </p>
          <p className="text-sm text-muted-foreground">{state.success}</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          Close
        </Button>
      </div>
    );
  }

  // Show error toast on mount if error exists
  if ("error" in state && state.error) {
    // toast is called, but we'll also show inline error below
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Current Password Field */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          placeholder="••••••••"
          required
          disabled={isPending}
          aria-invalid={"error" in state && !!state.error}
        />
      </div>

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

      {/* Confirm New Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
        <Input
          id="confirmNewPassword"
          name="confirmNewPassword"
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
        {isPending ? "Changing password..." : "Change Password"}
      </Button>
    </form>
  );
}
