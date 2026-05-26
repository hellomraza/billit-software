"use client";

import { MoneyText } from "@/components/shared/money-text";
import { Button } from "@/components/ui/button";
import clientAxios from "@/lib/axios/client";
import { formatDateTime } from "@/lib/formatters/date";
import { ROUTES } from "@/lib/routes";
import { Invoice, InvoiceRefundSummary } from "@/types/invoice";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Props {
  invoice: Invoice;
  existingRefunds: InvoiceRefundSummary[];
  tenantId: string;
}
export function RefundSelectionForm({
  invoice,
  existingRefunds,
  tenantId,
}: Props) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
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

  const itemizedRefundItems = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const totalUnits = itemizedRefundItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const totalItemizedRefundAmount = itemizedRefundItems.reduce(
    (sum, { productId, quantity }) => {
      const item = invoice.items.find((i) => i.productId === productId)!;
      const unit = item.quantity > 0 ? item.subtotal / item.quantity : 0;
      return sum + quantity * unit;
    },
    0,
  );

  const fullRefundAmount = Math.abs(invoice.grandTotal);

  const router = useRouter();

  const submitRefund = async (
    items: Array<{ productId: string; quantity: number }>,
    successMessage: string,
  ) => {
    setError(null);

    const payload = {
      clientGeneratedId: uuidv4(),
      refundReason: refundReason.trim() || null,
      items,
    };

    setSubmitting(true);
    try {
      const url = `/tenants/${tenantId}/invoices/${invoice.id}/refund`;
      // note: tenantId is passed as prop from server page
      const { data } = await clientAxios.post(url, payload);

      toast.success(successMessage);

      // On success (201) or idempotent 200, navigate to the refund invoice
      const created = data?.data || data;
      const newId =
        created?.invoiceId ||
        created?.id ||
        created?._id ||
        created?.invoice_id;
      if (newId) {
        router.push(ROUTES.INVOICE_DETAIL(newId));
      } else {
        // fallback: go to invoices list
        router.push(ROUTES.INVOICES);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 400) {
          // validation errors
          const details = err.response?.data?.details || err.response?.data;
          setError(
            details?.message ||
              "Validation error. Please check the quantities and try again.",
          );
        } else if (status === 409) {
          setError("This invoice has not finished syncing. Please wait.");
        } else {
          setError(
            err.response?.data?.message || "Failed to refund bill. Try again.",
          );
        }
      } else if (err instanceof Error) {
        setError(err.message || "Failed to refund bill. Try again.");
      } else {
        setError("Failed to refund bill. Try again.");
      }
      setSubmitting(false);
    }
  };

  const handleFullRefund = async () => {
    await submitRefund([], "This bill is fully refunded.");
  };

  const handleItemizedRefund = async () => {
    if (totalUnits === 0) {
      setError("Select at least one item for an itemized refund.");
      return;
    }

    await submitRefund(itemizedRefundItems, "Selected items refunded.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Refund bill</h2>
          <div className="text-sm text-muted-foreground">
            Invoice {invoice.invoiceNumber} •{" "}
            {formatDateTime(invoice.createdAt)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href={ROUTES.INVOICE_DETAIL(invoice.id)} className="text-sm">
            Cancel
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-4 bg-muted/20 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
          <div>
            <div className="font-medium">Full bill refund</div>
            <div className="text-sm text-muted-foreground">
              Refund the entire bill without selecting individual items.
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvancedOptions((value) => !value)}
            disabled={submitting}
          >
            {showAdvancedOptions
              ? "Hide itemized options"
              : "Show itemized options"}
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md bg-background p-4">
          <div>
            <div className="text-sm text-muted-foreground">Refund total</div>
            <div className="text-xs text-muted-foreground">
              This bill will be fully refunded.
            </div>
          </div>
          <div className="font-semibold text-rose-600">
            <MoneyText amount={-Number(fullRefundAmount.toFixed(2))} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            The refund will be recorded with no item lines. Add a reason if you
            want it on the refund invoice.
          </div>

          <Button
            type="button"
            onClick={handleFullRefund}
            disabled={submitting}
          >
            {submitting ? "Refunding..." : "Refund bill"}
          </Button>
        </div>
      </div>

      {showAdvancedOptions && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="font-medium">Itemized refund options</h3>
            <p className="text-sm text-muted-foreground">
              Keep this path for future item-level refunds. It stays hidden
              unless you open advanced options.
            </p>
          </div>

          <div className="space-y-4">
            {invoice.items.map((item) => {
              const max = maxReturnable(item.productId, item.quantity);
              const unitPrice =
                item.quantity > 0 ? item.subtotal / item.quantity : 0;
              const qty = quantities[item.productId] || 0;
              return (
                <div key={item.productId} className="p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Sold: {item.quantity} • Already refunded:{" "}
                        {alreadyRefunded[item.productId] || 0}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm">Unit price</div>
                      <MoneyText amount={Number(unitPrice.toFixed(2))} />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="text-sm text-muted-foreground block">
                        Refund quantity
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={max}
                        value={qty}
                        onChange={(e) =>
                          handleQuantityChange(item.productId, e.target.value)
                        }
                        onBlur={() => handleQuantityBlur(item.productId)}
                        className="w-24 input"
                        disabled={max === 0 || submitting}
                      />
                      {max === 0 && (
                        <div className="text-xs text-muted-foreground">
                          Already refunded
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 text-right">
                      <div className="text-sm text-muted-foreground">
                        Line refund
                      </div>
                      <div className="font-medium text-rose-600">
                        <MoneyText amount={-(qty * unitPrice)} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 border rounded-md">
        <label className="text-sm text-muted-foreground">
          Refund reason (optional)
        </label>
        <textarea
          maxLength={500}
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          className="w-full mt-2 textarea"
          rows={4}
          disabled={submitting}
        />
        <div className="text-sm text-muted-foreground mt-1">
          {refundReason.length}/500
        </div>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      {showAdvancedOptions && (
        <div className="p-4 border rounded-md space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Advanced itemized refund total
            </div>

            <div className="text-right">
              <div className="font-semibold text-rose-600">
                <MoneyText
                  amount={-Number(totalItemizedRefundAmount.toFixed(2))}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {totalUnits} item{totalUnits === 1 ? "" : "s"} selected
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleItemizedRefund}
              disabled={submitting}
              variant="outline"
            >
              {submitting ? "Refunding..." : "Refund selected items"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
