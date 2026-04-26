"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BillingCustomerDetailsProps {
  customerName: string;
  customerPhone: string;
  onCustomerNameChange: (name: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
}

export function BillingCustomerDetails({
  customerName,
  customerPhone,
  onCustomerNameChange,
  onCustomerPhoneChange,
}: BillingCustomerDetailsProps) {
  return (
    <div className="p-4 space-y-3 rounded-lg">
      <div className="space-y-0.5">
        <Label
          htmlFor="customer-name"
          className="text-xs text-muted-foreground uppercase mb-2 tracking-wide"
        >
          Customer Name (Optional)
        </Label>
        <Input
          id="customer-name"
          placeholder="Walk-in customer"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-0.5">
        <Label
          htmlFor="customer-phone"
          className="text-xs text-muted-foreground uppercase mb-2 tracking-wide"
        >
          Phone (Optional)
        </Label>
        <Input
          id="customer-phone"
          type="tel"
          placeholder="9876543210"
          value={customerPhone}
          onChange={(e) => onCustomerPhoneChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
}
