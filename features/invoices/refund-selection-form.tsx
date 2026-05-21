"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Invoice, InvoiceRefundSummary } from "@/types/invoice";
import { ROUTES } from "@/lib/routes";
export function RefundSelectionForm({ invoice, existingRefunds }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(invoice.items.map((it) => [it.productId, 0])),
  );
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyRefunded = useMemo(() => {
    const map: Record<string, number> = {};
    existingRefunds.forEach((r) => {
      r.items?.forEach((it) => {
        map[it.productId] = (map[it.productId] || 0) + it.quantity;
      });
    });
    return map;
  }, [existingRefunds]);

  const maxReturnable = (itemId: string, originalQty: number) => {
    const refunded = alreadyRefunded[itemId] || 0;
    return Math.max(0, originalQty - refunded);
  };

  const handleQuantityChange = (productId: string, raw: string) => {
    const num = Math.floor(Number(raw) || 0);
    const it = invoice.items.find((i) => i.productId === productId)!;
    const max = maxReturnable(productId, it.quantity);
    const clamped = Math.max(0, Math.min(max, num));
    setQuantities((s) => ({ ...s, [productId]: clamped }));
  };

  const handleQuantityBlur = (productId: string) => {
    // ensure integer and clamps enforced on blur
    const val = quantities[productId] || 0;
    const it = invoice.items.find((i) => i.productId === productId)!;
    const max = maxReturnable(productId, it.quantity);
    const clamped = Math.max(0, Math.min(max, Math.floor(val)));
    if (clamped !== val) setQuantities((s) => ({ ...s, [productId]: clamped }));
  };

  const totalUnits = Object.values(quantities).reduce((a, b) => a + b, 0);

  const totalRefundAmount = Object.entries(quantities).reduce((sum, [pid, qty]) => {
    const it = invoice.items.find((i) => i.productId === pid)!;
    const unit = it.quantity > 0 ? it.subtotal / it.quantity : 0;
    return sum + qty * unit;
  }, 0);

  const handleConfirm = () => {
    // T-10.3 will implement the network submission. For now show basic validation.
    setError(null);
    if (totalUnits === 0) {
      setError("Select at least one item to return.");
      return;
    }
    setSubmitting(true);
    // stub: simulate a short delay then navigate or callback in future task
    setTimeout(() => {
      setSubmitting(false);
      // In T-10.3 we will perform the API call and redirect to the refund invoice.
      // eslint-disable-next-line no-console
      console.log("Refund payload:", {
        clientGeneratedId: "<generated-later>",
        refundReason: refundReason || null,
        items: Object.entries(quantities)
          .filter(([, q]) => q > 0)
          .map(([productId, quantity]) => ({ productId, quantity })),
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Process Return</h2>
          <div className="text-sm text-muted-foreground">
            Invoice {invoice.invoiceNumber} • {formatDateTime(invoice.createdAt)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href={ROUTES.INVOICE_DETAIL(invoice.id)} className="text-sm">
            Cancel
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {invoice.items.map((item) => {
          const max = maxReturnable(item.productId, item.quantity);
          const unitPrice = item.quantity > 0 ? item.subtotal / item.quantity : 0;
          const qty = quantities[item.productId] || 0;
          return (
            <div key={item.productId} className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    Sold: {item.quantity} • Already returned: {alreadyRefunded[item.productId] || 0}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm">Unit price</div>
                  <MoneyText amount={Number(unitPrice.toFixed(2))} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-sm text-muted-foreground block">Return quantity</label>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={qty}
                    onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                    onBlur={() => handleQuantityBlur(item.productId)}
                    className="w-24 input"
                    disabled={max === 0 || submitting}
                  />
                  {max === 0 && <div className="text-xs text-muted-foreground">Already returned</div>}
                </div>

                <div className="md:col-span-2 text-right">
                  <div className="text-sm text-muted-foreground">Line refund</div>
                  <div className="font-medium text-rose-600">
                    <MoneyText amount={-(qty * unitPrice)} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border rounded-md">
        <label className="text-sm text-muted-foreground">Reason for return (optional)</label>
        <textarea
          maxLength={500}
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          className="w-full mt-2 textarea"
          rows={4}
          disabled={submitting}
        />
        <div className="text-sm text-muted-foreground mt-1">{refundReason.length}/500</div>

        <div className="flex justify-between items-center mt-4">
          <div>
            <div>Total units</div>
            <div className="font-semibold">{totalUnits}</div>
          </div>

          <div className="text-right">
            <div className="text-sm">Total refund</div>
            <div className="font-semibold text-rose-600">
              <MoneyText amount={-Number(totalRefundAmount.toFixed(2))} />
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}

        <div className="flex justify-end mt-4">
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={submitting || totalUnits === 0}
          >
            {submitting ? "Processing..." : "Confirm Return"}
          </button>
        </div>
      </div>
    </div>
  );
}
