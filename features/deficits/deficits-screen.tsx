"use client";

import { DeficitGroup as DeficitCardGroup } from "@/components/shared/deficit-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeficitList } from "@/features/deficits/deficit-list";
import { ResolveAdjustmentForm } from "@/features/deficits/resolve-adjustment-form";
import { ResolveStockAdditionForm } from "@/features/deficits/resolve-stock-addition-form";
import {
  DeficitGroup as ApiDeficitGroup,
  DeficitRecord as ApiDeficitRecord,
  PaginatedResponse,
} from "@/lib/types/api";
import { DeficitRecord } from "@/types";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface DeficitsScreenProps {
  groupedDeficits: ApiDeficitGroup[];
  detailedDeficits: PaginatedResponse<ApiDeficitRecord>;
}

export function DeficitsScreen({
  groupedDeficits,
  detailedDeficits,
}: DeficitsScreenProps) {
  const router = useRouter();
  const announcementRef = useRef<HTMLDivElement>(null);
  const [resolveCandidate, setResolveCandidate] = useState<{
    productId: string;
    productName: string;
    totalMissing: number;
  } | null>(null);
  const [adjustCandidate, setAdjustCandidate] = useState<{
    productId: string;
    productName: string;
  } | null>(null);

  const recordsByGroup = useMemo(() => {
    const grouped: Record<string, DeficitRecord[]> = {};

    groupedDeficits.forEach((group) => {
      grouped[group.productId] = group.records.map((record) => ({
        id: record._id,
        productId: record.productId,
        invoiceId: record.linkedInvoiceId,
        missingQuantity: record.quantity,
        status: record.status,
        createdAt: record.createdAt,
        resolvedAt: record.resolvedAt,
      }));
    });

    return grouped;
  }, [groupedDeficits]);

  const deficitGroups = useMemo<DeficitCardGroup[]>(
    () =>
      groupedDeficits.map((group) => ({
        productId: group.productId,
        productName: group.productName,
        totalMissing: group.totalPendingQuantity,
        status: "PENDING",
        recordsCount: group.recordCount,
        lastUpdated: group.mostRecentDate,
      })),
    [groupedDeficits],
  );

  const handleResolve = (productId: string, totalMissing: number) => {
    const group = groupedDeficits.find((item) => item.productId === productId);
    const productName = group?.productName || "product";

    if (announcementRef.current) {
      announcementRef.current.textContent = `Open stock addition resolution for ${productName}.`;
    }

    toast.info("Resolve deficit", {
      description: `Record stock addition for ${totalMissing} pending units of ${productName}.`,
    });

    setResolveCandidate({
      productId,
      productName,
      totalMissing,
    });
  };

  const handleAdjust = (productId: string) => {
    const group = groupedDeficits.find((item) => item.productId === productId);
    const productName = group?.productName || "product";

    if (announcementRef.current) {
      announcementRef.current.textContent = `Open adjustment resolution for ${productName}.`;
    }

    toast.info("Mark deficit as adjustment", {
      description: `Record a write-off reason for pending deficits of ${productName}.`,
    });

    setAdjustCandidate({ productId, productName });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-350 mx-auto animate-in fade-in duration-500">
      <div className="animate-in slide-in-from-top duration-500 delay-100">
        <PageHeader
          title="Inventory Deficits"
          description="Track missing stock quantities resulting from forced sales at zero inventory."
        />
      </div>

      <div className="flex-1 overflow-auto animate-in fade-in duration-500 delay-200 space-y-6">
        {groupedDeficits.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No pending deficits"
            description="You're all caught up. New deficits will appear here when stock falls below billed quantities."
          />
        ) : (
          <DeficitList
            deficits={deficitGroups}
            recordsByGroup={recordsByGroup}
            onResolve={handleResolve}
            onAdjust={handleAdjust}
            isLoading={false}
          />
        )}

        {detailedDeficits.data.length > 0 ? (
          <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Detailed Deficit Records</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {detailedDeficits.data.length} of {detailedDeficits.total}{" "}
              records (page {detailedDeficits.page}, limit{" "}
              {detailedDeficits.limit}).
            </p>

            <div className="mt-3 space-y-2">
              {detailedDeficits.data.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {record.productId}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Invoice {record.linkedInvoiceId} • Outlet{" "}
                      {record.outletId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">-{record.quantity}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      <Dialog
        open={!!resolveCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setResolveCandidate(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Deficit with Stock Addition</DialogTitle>
            <DialogDescription>
              Record received stock for{" "}
              <span className="font-semibold">
                {resolveCandidate?.productName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {resolveCandidate ? (
            <ResolveStockAdditionForm
              productId={resolveCandidate.productId}
              productName={resolveCandidate.productName}
              suggestedQuantity={resolveCandidate.totalMissing}
              onResolved={() => router.refresh()}
              onClose={() => setResolveCandidate(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!adjustCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustCandidate(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Deficit as Adjustment</DialogTitle>
            <DialogDescription>
              Mark pending deficits for{" "}
              <span className="font-semibold">
                {adjustCandidate?.productName}
              </span>{" "}
              as adjustment with a reason.
            </DialogDescription>
          </DialogHeader>

          {adjustCandidate ? (
            <ResolveAdjustmentForm
              productId={adjustCandidate.productId}
              productName={adjustCandidate.productName}
              onResolved={() => router.refresh()}
              onClose={() => setAdjustCandidate(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
