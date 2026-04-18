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
    } catch (err: any) {
      // Check if current password is incorrect (400 error)
      if (err.message && err.message.includes("400")) {
        return { error: "Current password is incorrect." };
      }
      return { error: err.message };
    }
  },
);
