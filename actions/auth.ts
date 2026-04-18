"use server";

import { createServerAxios } from "@/lib/axios/server";
import { validatedAction } from "@/lib/safe-action";
import { Tenant } from "@/lib/types/api";
import { z } from "zod";

// A.1 Signup Schema
const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /(?=.*[a-zA-Z])(?=.*[0-9])/,
      "Password must contain at least one letter and one number",
    ),
});

// A.1 Signup Action
export const signupAction = validatedAction(signupSchema, async (data) => {
  try {
    const api = await createServerAxios();
    const { data: res } = await api.post("/auth/signup", data);
    // Return token and tenant to client — client component handles saveAuthSession
    return {
      success: "Account created successfully",
      accessToken: res.accessToken,
      tenant: res.tenant,
    };
  } catch (err: any) {
    return { error: err.message };
  }
});

// A.2 Login Schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tenant: Tenant;
};
// A.2 Login Action
export const loginAction = validatedAction(loginSchema, async (data) => {
  try {
    const api = await createServerAxios();
    const { data: res } = await api.post<LoginResponse>("/auth/login", data);
    // Return token and tenant to client — client component handles saveAuthSession
    return {
      success: "Logged in successfully",
      accessToken: res.accessToken,
      tenant: res.tenant,
    };
  } catch (err: any) {
    // Show generic error for 401 to prevent account enumeration
    if (err.message && err.message.includes("401")) {
      return { error: "Incorrect email or password." };
    }
    return { error: err.message };
  }
});

// A.3 Logout Action
export const logoutAction = async () => {
  try {
    const api = await createServerAxios();
    await api.post("/auth/logout");
    return { success: "Logged out successfully" };
  } catch (err: any) {
    // Even if logout fails on server, we still want to clear client-side state
    return { success: "Logged out successfully" };
  }
};

// A.4 Forgot Password Schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordResponse = {
  message: string;
  token?: string; // In dev, API returns resetToken directly for testing. In prod, this is undefined.
};

// A.4 Forgot Password Action
export const forgotPasswordAction = validatedAction(
  forgotPasswordSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      const { data: res } = await api.post<ForgotPasswordResponse>(
        "/auth/forgot-password",
        data,
      );
      // In dev, API returns resetToken directly. In prod, it's undefined.
      console.log("Forgot Password API response:", res);
      return {
        success:
          "If an account with that email exists, you'll receive a reset link.",
        resetToken: res.token ?? null,
      };
    } catch (err: any) {
      // Even on error, show the same success message for security
      return {
        success:
          "If an account with that email exists, you'll receive a reset link.",
      };
    }
  },
);

// A.5 Reset Password Schema
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /(?=.*[a-zA-Z])(?=.*[0-9])/,
        "Password must contain at least one letter and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// A.5 Reset Password Action
export const resetPasswordAction = validatedAction(
  resetPasswordSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      await api.post("/auth/reset-password", {
        token: data.token,
        newPassword: data.newPassword,
      });
      // API sends confirmation email on success
      return {
        success:
          "Password reset successfully. A confirmation email has been sent to your registered email address.",
      };
    } catch (err: any) {
      // Check if token is invalid/expired
      if (err.message && err.message.includes("400")) {
        return { error: "Reset link has expired. Please request a new one." };
      }
      return { error: err.message };
    }
  },
);
