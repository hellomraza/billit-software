"use client";

import { updateOnboardingOutletAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAbbreviation } from "@/lib/utils/abbreviation";
import { useActionState } from "react";

export function OutletForm() {
  const [state, formAction, isPending] = useActionState(
    updateOnboardingOutletAction,
    {
      error: "",
      success: "",
    },
  );

  const handleOutletNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const outletName = input.value;

    // Auto-generate abbreviation and update the abbr input
    if (outletName.trim()) {
      const generated = generateAbbreviation(outletName);
      const abbrInput = document.getElementById(
        "outletAbbr",
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
      {/* Outlet Name Field */}
      <div className="space-y-2">
        <Label htmlFor="outletName">Outlet Name</Label>
        <Input
          id="outletName"
          name="outletName"
          type="text"
          placeholder="e.g. Downtown Branch"
          required
          disabled={isPending}
          onChange={handleOutletNameChange}
          defaultValue="Main"
          aria-invalid={"error" in state && !!state.error}
        />
      </div>

      {/* Outlet Abbreviation Field */}
      <div className="space-y-2">
        <Label htmlFor="outletAbbr">Outlet Abbreviation</Label>
        <Input
          id="outletAbbr"
          name="outletAbbr"
          type="text"
          placeholder="DTB"
          maxLength={6}
          required
          disabled={isPending}
          onFocus={handleAbbrFocus}
          aria-invalid={"error" in state && !!state.error}
          defaultValue=""
        />
        <p className="text-xs text-muted-foreground">
          A 3-6 character prefix (uppercase letters and numbers only).
          Auto-generated from your outlet name, but you can edit it.
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
        {isPending ? "Setting up outlet..." : "Continue to GST Setup"}
      </Button>
    </form>
  );
}
