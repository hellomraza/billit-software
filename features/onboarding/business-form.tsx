"use client";

import { updateOnboardingBusinessAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAbbreviation } from "@/lib/utils/abbreviation";
import { useActionState } from "react";

export function BusinessForm() {
  const [state, formAction, isPending] = useActionState(
    updateOnboardingBusinessAction,
    {
      error: "",
      success: "",
    },
  );

  // Auto-generate abbreviation when form loads (can be pre-filled from API if needed)
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const businessName = input.value;

    // Auto-generate abbreviation and update the abbr input
    if (businessName.trim()) {
      const generated = generateAbbreviation(businessName);
      const abbrInput = document.getElementById(
        "businessAbbr",
      ) as HTMLInputElement;
      if (abbrInput && !abbrInput.dataset.manuallyEdited) {
        abbrInput.value = generated;
      }
    }
  };

  const handleAbbrFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Mark as manually edited when user focuses
    e.currentTarget.dataset.manuallyEdited = "true";
  };

  return (
    <form action={formAction} className="w-full space-y-6">
      {/* Business Name Field */}
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          name="businessName"
          type="text"
          placeholder="e.g. SuperMart Central"
          required
          disabled={isPending}
          onChange={handleBusinessNameChange}
          aria-invalid={"error" in state && !!state.error}
        />
      </div>

      {/* Business Abbreviation Field */}
      <div className="space-y-2">
        <Label htmlFor="businessAbbr">Business Abbreviation</Label>
        <Input
          id="businessAbbr"
          name="businessAbbr"
          type="text"
          placeholder="SMC"
          maxLength={6}
          required
          disabled={isPending}
          onFocus={handleAbbrFocus}
          aria-invalid={"error" in state && !!state.error}
          defaultValue=""
        />
        <p className="text-xs text-muted-foreground">
          A 3-6 character prefix (uppercase letters and numbers only).
          Auto-generated from your business name, but you can edit it.
        </p>
      </div>

      {/* Error Message */}
      {"error" in state && state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Setting up business..." : "Continue to Outlet Setup"}
      </Button>
    </form>
  );
}
