"use server";

import { createServerAxios } from "@/lib/axios/server";
import { validatedAction } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// A.6 Change Password Schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /(?=.*[a-zA-Z])(?=.*[0-9])/,
        "Password must contain at least one letter and one number",
      ),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// A.6 Change Password Action
export const changePasswordAction = validatedAction(
  changePasswordSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      await api.post("/settings/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      // Revalidate settings page to reflect changes
      revalidatePath("/settings");
      return { success: "Password changed successfully." };
    } catch (err: unknown) {
      // Check if current password is incorrect (400 error)
      if (err instanceof Error) {
        if (err.message.includes("400")) {
          return { error: "Current password is incorrect.", success: "" };
        }
        return { error: err.message, success: "" };
      }
      return { error: "An unknown error occurred.", success: "" };
    }
  },
);

// C.2 Update Business Settings Schema
const updateBusinessSettingsSchema = z.object({
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Business name must be at most 100 characters"),
});

// C.2 Update Business Settings Action
export const updateBusinessSettingsAction = validatedAction(
  updateBusinessSettingsSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      await api.patch("/settings/business", {
        businessName: data.businessName,
      });
      revalidatePath("/settings");
      return { success: "Business settings updated successfully." };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message, success: "" };
      }
      return { error: "An unknown error occurred.", success: "" };
    }
  },
);

// C.3 Update GST Settings Schema
const updateGstSettingsSchema = z.object({
  gstNumber: z.string().optional(),
});

// C.3 Update GST Settings Action
export const updateGstSettingsAction = validatedAction(
  updateGstSettingsSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      await api.patch("/settings/gst", {
        gstNumber: data.gstNumber || "",
      });
      // Revalidate both settings and billing pages
      revalidatePath("/settings");
      revalidatePath("/");
      return { success: "GST settings updated successfully.", error: "" };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message };
      }
      return { error: "An unknown error occurred." };
    }
  },
);
