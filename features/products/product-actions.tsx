import { deleteProductAction, restoreProductAction } from "@/actions/products";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStoredOutletId } from "@/lib/auth-tokens";
import { ROUTES } from "@/lib/routes";
import { ProductWithStock } from "@/lib/types/api";
import { Edit2, Package, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import StockUpdateForm from "./stock-update-form";

const ProductActions = ({ row }: { row: ProductWithStock }) => {
  const [isDeleteProductOpen, setDeleteCandidate] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);

  const [outletId] = useState(() => {
    return getStoredOutletId();
  });

  const [isDeleting, startTransition] = useTransition();
  const [isRestoring, startRestoringTransition] = useTransition();

  const handleDeleteInitial = () => setDeleteCandidate(true);

  const handleUpdateStockInitial = () => {
    setIsAddStockOpen(true);
  };

  const handleConfirmDelete = async () => {
    startTransition(async () => {
      await deleteProductAction({ productId: row._id });
    });
  };

  const handleRestore = async (product: ProductWithStock) => {
    startRestoringTransition(async () => {
      const result = await restoreProductAction({ productId: product._id });

      if (result?.error) {
        toast.error("Failed to restore product", {
          description: result.error,
        });
      } else {
        toast.success("Product restored successfully");
      }
    });
  };

  return (
    <>
      <div
        className="flex items-center justify-end gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label={`Edit ${row.name}`}
                >
                  <Link href={ROUTES.PRODUCTS_EDIT(row._id)}>
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <TooltipContent>
              <p>Edit Product</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!row.isDeleted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleUpdateStockInitial}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label={`Update stock for ${row.name}`}
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent>
                <p>Add Stock</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {row.isDeleted ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRestore(row)}
            disabled={isRestoring}
            className="h-8 w-8 text-success hover:text-success hover:bg-success/10 disabled:opacity-50"
            aria-label={`Restore ${row.name}`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteInitial}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Delete ${row.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent>
                <p>Delete Product</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <ConfirmationDialog
        isOpen={!!isDeleteProductOpen}
        title="Delete Product"
        description={`Are you sure you want to delete ${row.name}? This will hide it from active billing but maintain references in past invoices.`}
        confirmText="Delete"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(false)}
      />

      <Dialog
        open={!!isAddStockOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddStockOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Add stock for <span className="font-semibold">{row?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <StockUpdateForm
            outletId={outletId!}
            productId={row?._id ?? ""}
            currentStock={row?.stock ?? 0}
            onClose={() => {
              setIsAddStockOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductActions;
