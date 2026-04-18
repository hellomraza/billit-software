"use client";

import { updateGstSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { toast } from "sonner";

interface GstSettingsFormProps {
  gstNumber: string;
  gstEnabled: boolean;
}

export function GstSettingsForm({
  gstNumber,
  gstEnabled,
}: GstSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateGstSettingsAction,
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
      {/* GST Enabled Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="gstEnabled" className="text-base">
            Enable GST
          </Label>
          <p className="text-sm text-muted-foreground">
            Register your business for Goods and Services Tax
          </p>
        </div>
        <input
          id="gstEnabled"
          name="gstEnabled"
          type="checkbox"
          defaultChecked={gstEnabled}
          disabled={isPending}
          className="w-5 h-5 cursor-pointer"
        />
      </div>

      {/* GST Number Input */}
      <div className="space-y-2">
        <Label htmlFor="gstNumber">GST Identification Number (GSTIN)</Label>
        <Input
          id="gstNumber"
          name="gstNumber"
          type="text"
          defaultValue={gstNumber}
          placeholder="15 character GSTIN (e.g., 27AAPCT0055D1Z5)"
          disabled={isPending}
          maxLength={15}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty if not registered for GST
        </p>
        {state && "error" in state && state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save GST Settings"}
        </Button>
      </div>
    </form>
  );
}
