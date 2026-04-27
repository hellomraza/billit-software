"use server";

import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { validatedAction } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const resolveStockAdditionSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

type ResolveStockAdditionInput = z.infer<typeof resolveStockAdditionSchema>;

type ResolveStockAdditionResponse = {
  resolved: number;
  totalResolved: number;
  remainingQuantity: number;
};

export const resolveStockAdditionAction = validatedAction(
  resolveStockAdditionSchema,
  async (data: ResolveStockAdditionInput) => {
    try {
      const tenantId = await getTenantId();
      const api = await createServerAxios();

      const { data: response } = await api.patch<ResolveStockAdditionResponse>(
        `/tenants/${tenantId}/deficits/by-product/${data.productId}/resolve-stock-addition`,
        {
          quantity: data.quantity,
          notes: data.notes,
        },
      );

      revalidatePath("/deficits");
      revalidatePath("/products");

      return {
        success: "Deficits resolved with stock addition",
        resolved: response.resolved,
        totalResolved: response.totalResolved,
        remainingQuantity: response.remainingQuantity,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message || "Failed to resolve deficits" };
      }
      return { error: "Failed to resolve deficits" };
    }
  },
);

const resolveAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  reason: z.enum(["DAMAGE", "LOSS", "CORRECTION"], {
    error: 'Reason must be one of "DAMAGE", "LOSS", or "CORRECTION"',
  }),
  notes: z.string().optional(),
});

type ResolveAdjustmentInput = z.infer<typeof resolveAdjustmentSchema>;

type ResolveAdjustmentResponse = {
  resolved: number;
  totalResolved: number;
};

export const resolveAdjustmentAction = validatedAction(
  resolveAdjustmentSchema,
  async (data: ResolveAdjustmentInput) => {
    try {
      const tenantId = await getTenantId();
      const api = await createServerAxios();

      const { data: response } = await api.patch<ResolveAdjustmentResponse>(
        `/tenants/${tenantId}/deficits/by-product/${data.productId}/resolve-adjustment`,
        {
          reason: data.reason,
          notes: data.notes,
        },
      );

      revalidatePath("/deficits");

      return {
        success: "Deficits resolved as adjustment",
        resolved: response.resolved,
        totalResolved: response.totalResolved,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message || "Failed to resolve adjustment" };
      }
      return { error: "Failed to resolve adjustment" };
    }
  },
);
