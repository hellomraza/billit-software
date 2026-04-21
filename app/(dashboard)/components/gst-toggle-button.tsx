"use client";
import { useGstActions, useIsGstEnabled } from "@/stores/get-store";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";

const GstToggleButton = () => {
  const gstEnabled = useIsGstEnabled();
  const { toggleGst } = useGstActions();

  const handleGstToggle = () => {
    const newState = !gstEnabled;
    toggleGst();

    toast.success(`GST ${newState ? "Enabled" : "Disabled"}`, {
      description: `GST will be ${newState ? "applied to" : "excluded from"} future invoices.`,
    });
  };

  return (
    <Button
      variant={gstEnabled ? "default" : "outline"}
      size="sm"
      onClick={handleGstToggle}
      className="gap-2 h-9 px-3 text-xs sm:text-sm"
      aria-pressed={gstEnabled}
      aria-label={`GST is ${gstEnabled ? "enabled" : "disabled"}`}
    >
      <Receipt className="h-4 w-4" />
      <span className="hidden sm:inline">GST</span>
      <span className="font-semibold text-xs">{gstEnabled ? "ON" : "OFF"}</span>
    </Button>
  );
};

export default GstToggleButton;
