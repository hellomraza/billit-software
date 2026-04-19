"use server";

import { createStock } from "@/lib/api/stock";
import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { validatedAction } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  basePrice: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .multipleOf(0.01, "Price can have at most 2 decimal places"),
  gstRate: z.coerce
    .number()
    .refine((v) => [0, 5, 12, 18, 28].includes(v), "Select a valid GST rate"),
  deficitThreshold: z.coerce
    .number({ invalid_type_error: "Threshold must be a number" })
    .int("Threshold must be a whole number")
    .min(1, "Threshold must be at least 1")
    .default(10),
  openingStock: z.coerce
    .number()
    .int("Opening stock must be a whole number")
    .min(0, "Opening stock cannot be negative")
    .default(0),
});

type CreateProductInput = z.infer<typeof createProductSchema>;

export const createProductAction = validatedAction(
  createProductSchema,
  async (data: CreateProductInput) => {
    try {
      const tenantId = await getTenantId();
      const api = await createServerAxios();
      const cookieStore = await cookies();

      // Create product
      const { data: product } = await api.post(
        `/tenants/${tenantId}/products`,
        {
          name: data.name,
          basePrice: data.basePrice,
          gstRate: data.gstRate,
          deficitThreshold: data.deficitThreshold,
        },
      );

      // Set opening stock if > 0
      if (data.openingStock > 0) {
        const outletId = cookieStore.get("outlet_id")?.value;
        if (outletId) {
          await createStock(product._id, outletId, data.openingStock);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message || "Failed to create product" };
      }
      return { error: "Failed to create product" };
    }
    revalidatePath("/products");
    redirect("/products");
  },
);

// D.5: Update Product
const updateProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().min(1).max(200).optional(),
  basePrice: z.coerce
    .number()
    .positive("Price must be greater than 0")
    .multipleOf(0.01, "Price can have at most 2 decimal places")
    .optional(),
  gstRate: z.coerce
    .number()
    .refine((v) => [0, 5, 12, 18, 28].includes(v), "Select a valid GST rate")
    .optional(),
  deficitThreshold: z.coerce
    .number()
    .int("Threshold must be a whole number")
    .min(1, "Threshold must be at least 1")
    .optional(),
});

type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const updateProductAction = validatedAction(
  updateProductSchema,
  async (data: UpdateProductInput) => {
    try {
      const tenantId = await getTenantId();
      const api = await createServerAxios();

      // Only send provided fields to API
      const updatePayload: Partial<UpdateProductInput> = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.basePrice !== undefined)
        updatePayload.basePrice = data.basePrice;
      if (data.gstRate !== undefined) updatePayload.gstRate = data.gstRate;
      if (data.deficitThreshold !== undefined)
        updatePayload.deficitThreshold = data.deficitThreshold;

      await api.put(
        `/tenants/${tenantId}/products/${data.productId}`,
        updatePayload,
      );

      // Revalidate both the products list and the edit page
      revalidatePath(`/products/${data.productId}/edit`);
      revalidatePath("/products");

      return { success: "Product updated successfully" };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message || "Failed to update product" };
      }
      return { error: "Failed to update product" };
    }
  },
);

// D.6: Delete Product (Soft Delete)
const deleteProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

type DeleteProductInput = z.infer<typeof deleteProductSchema>;

export const deleteProductAction = async (data: DeleteProductInput) => {
  try {
    const validatedData = deleteProductSchema.parse(data);
    const tenantId = await getTenantId();
    const api = await createServerAxios();

    await api.delete(
      `/tenants/${tenantId}/products/${validatedData.productId}`,
    );

    revalidatePath("/products");
  } catch (err: unknown) {
    // Handle specific error: unresolved deficits
    if (err instanceof Error) {
      return { error: err.message || "Failed to delete product" };
    }
    return { error: "Failed to delete product" };
  }

  redirect("/products");
};

// D.7: Restore Product (Soft Undelete)
const restoreProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

type RestoreProductInput = z.infer<typeof restoreProductSchema>;

export const restoreProductAction = async (data: RestoreProductInput) => {
  try {
    const validatedData = restoreProductSchema.parse(data);
    const tenantId = await getTenantId();
    const api = await createServerAxios();

    await api.post(
      `/tenants/${tenantId}/products/${validatedData.productId}/restore`,
    );

    revalidatePath("/products");

    return { success: "Product restored successfully" };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || "Failed to restore product" };
    }
    return { error: "Failed to restore product" };
  }
};

// D.8: Update Stock (Manual)
const updateStockSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  outletId: z.string().min(1, "Outlet ID is required"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
});

type UpdateStockInput = z.infer<typeof updateStockSchema>;

export const updateStockAction = validatedAction(
  updateStockSchema,
  async (data: UpdateStockInput) => {
    try {
      const tenantId = await getTenantId();
      const api = await createServerAxios();

      await api.patch(
        `/tenants/${tenantId}/products/${data.productId}/stock`,
        { quantity: data.quantity },
        { params: { outletId: data.outletId } },
      );

      revalidatePath("/products");

      return { success: "Stock updated successfully" };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message || "Failed to update stock" };
      }
      return { error: "Failed to update stock" };
    }
  },
);
