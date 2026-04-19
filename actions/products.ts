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
