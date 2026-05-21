"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Invoice, InvoiceRefundSummary } from "@/types/invoice";
import { ROUTES } from "@/lib/routes";
import { formatDateTime } from "@/lib/formatters/date";
import { MoneyText } from "@/components/shared/money-text";

interface Props {
  invoice: Invoice;
  existingRefunds: InvoiceRefundSummary[];
}

export function RefundSelectionForm({ invoice, existingRefunds }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(invoice.items.map((it) => [it.productId, 0])),
  );

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
                  <MoneyText amount={item.subtotal / item.quantity} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Return quantity</label>
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={max}
                      value={quantities[item.productId]}
                      onChange={(e) =>
                        setQuantities((s) => ({ ...s, [item.productId]: Math.max(0, Math.min(max, Number(e.target.value) || 0)) }))
                      }
                      className="w-24 input"
                      disabled={max === 0}
                    />
                    {max === 0 && <div className="text-xs text-muted-foreground">Already returned</div>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Line refund</div>
                  <MoneyText amount={-(quantities[item.productId] * (item.subtotal / item.quantity))} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border rounded-md">
        <div className="flex justify-between">
          <div>Total units</div>
          <div>{Object.values(quantities).reduce((a, b) => a + b, 0)}</div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="font-medium">Total refund</div>
          <div className="font-medium text-rose-600">
            <MoneyText amount={-Object.entries(quantities).reduce((sum, [pid, qty]) => {
              const it = invoice.items.find((i) => i.productId === pid)!;
              return sum + qty * (it.subtotal / it.quantity);
            }, 0)} />
          </div>
        </div>
      </div>
    </div>
  );
}
