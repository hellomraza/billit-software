"use client";

import { updateBusinessSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { toast } from "sonner";

interface BusinessSettingsFormProps {
  businessName: string;
  businessAbbr: string;
  abbrLocked: boolean;
}

export function BusinessSettingsForm({
  businessName,
  businessAbbr,
  abbrLocked,
}: BusinessSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateBusinessSettingsAction,
    { error: "", success: "" },
  );

  // Show success toast when action succeeds
  if ("success" in state && state.success) {
    toast.success("Settings Saved", {
      description: state.success,
    });
  }

  // Show error toast when action fails
  if ("error" in state && state.error) {
    toast.error("Error", {
      description: state.error,
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Business Name Input */}
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          name="businessName"
          type="text"
          defaultValue={businessName}
          placeholder="Enter business name"
          disabled={isPending}
          required
          maxLength={100}
        />
        {state && "error" in state && state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>

      {/* Business Abbreviation (Read-only with lock indicator) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Business Abbreviation
          {abbrLocked && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              Locked
            </span>
          )}
        </Label>
        <Input
          type="text"
          value={businessAbbr}
          readOnly
          className="bg-muted/50 font-mono cursor-not-allowed"
        />
        {abbrLocked && (
          <p className="text-xs text-muted-foreground">
            This abbreviation is locked and cannot be edited.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
