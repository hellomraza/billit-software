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
