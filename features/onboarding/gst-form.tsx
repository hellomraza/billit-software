"use client";

import {
  completeOnboardingStepAction,
  updateOnboardingGstAction,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useRef } from "react";

export function GstForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    updateOnboardingGstAction,
    {
      error: "",
      success: "",
    },
  );

  const handleSkip = async () => {
    formRef.current?.reset();
    await completeOnboardingStepAction();
  };

  return (
    <form ref={formRef} action={formAction} className="w-full space-y-6">
      {/* GST Number Field */}
      <div className="space-y-2">
        <Label htmlFor="gstNumber">GST Identification Number (Optional)</Label>
        <Input
          id="gstNumber"
          name="gstNumber"
          type="text"
          placeholder="e.g. 27AAFCD5055K1Z5"
          disabled={isPending}
          aria-invalid={!!state.error}
        />
        <p className="text-xs text-muted-foreground">
          15-character GSTIN (alphanumeric). You can add or update this later in
          settings.
        </p>
      </div>

      {/* Error Message */}
      {"error" in state && state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isPending}
          onClick={handleSkip}
        >
          {isPending ? "Completing..." : "Skip for Now"}
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Completing..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
