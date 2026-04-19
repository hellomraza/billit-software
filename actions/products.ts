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
    } catch (err: any) {
      console.error("Error creating product:", JSON.stringify(err.response));
      return { error: err.message || "Failed to create product" };
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
      const updatePayload: any = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.basePrice !== undefined) updatePayload.basePrice = data.basePrice;
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
    } catch (err: any) {
      console.error("Error updating product:", JSON.stringify(err.response));
      return { error: err.message || "Failed to update product" };
    }
  },
);

// D.6: Delete Product (Soft Delete)
const deleteProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

type DeleteProductInput = z.infer<typeof deleteProductSchema>;

export const deleteProductAction = validatedAction(
  deleteProductSchema,
  async (data: DeleteProductInput) => {
    try {
      const tenantId = await getTenantId();
      const api = await createServerAxios();

      await api.delete(`/tenants/${tenantId}/products/${data.productId}`);

      revalidatePath("/products");

      return { success: "Product deleted successfully" };
    } catch (err: any) {
      // Handle specific error: unresolved deficits
      if (err.response?.status === 400) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Cannot delete this product";
        if (
          errorMessage.toLowerCase().includes("deficit") ||
          errorMessage.toLowerCase().includes("pending")
        ) {
          return {
            error:
              "This product has unresolved deficits. Resolve them before deleting.",
          };
        }
        return { error: errorMessage };
      }
      console.error("Error deleting product:", JSON.stringify(err.response));
      return { error: err.message || "Failed to delete product" };
    }
  },
);
