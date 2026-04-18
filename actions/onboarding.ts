"use server";

import { createServerAxios } from "@/lib/axios/server";
import { ROUTES } from "@/lib/routes";
import { validatedAction } from "@/lib/safe-action";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

// B.2 Update Business Information Schema
const onboardingBusinessSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(100),
  businessAbbr: z
    .string()
    .min(3, "Abbreviation must be at least 3 characters")
    .max(6, "Abbreviation must be at most 6 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Abbreviation must be uppercase letters and numbers only",
    )
    .transform((val) => val.toUpperCase()),
});

// B.2 Update Business Information Action
export const updateOnboardingBusinessAction = validatedAction(
  onboardingBusinessSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      await api.patch("/onboarding/business", {
        businessName: data.businessName,
        businessAbbr: data.businessAbbr,
      });
    } catch (err: any) {
      // Check for 409 conflict (abbreviation already taken)
      if (err.message && err.message.includes("409")) {
        return {
          error:
            "This abbreviation is already in use. Please choose a different one.",
        };
      }
      return { error: err.message };
    }

    // Only reached if API call succeeded
    // Set cookie to mark business step as completed
    const cookieStore = await cookies();
    cookieStore.set("billit_onboarding_business", "true", {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      path: "/",
    });

    redirect(ROUTES.ONBOARDING_OUTLET);
  },
);

// B.3 Update Outlet Information Schema
const onboardingOutletSchema = z.object({
  outletName: z.string().min(1, "Outlet name is required").max(100),
  outletAbbr: z
    .string()
    .min(3, "Abbreviation must be at least 3 characters")
    .max(6, "Abbreviation must be at most 6 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Abbreviation must be uppercase letters and numbers only",
    )
    .transform((val) => val.toUpperCase()),
});

// B.3 Update Outlet Information Action
export const updateOnboardingOutletAction = validatedAction(
  onboardingOutletSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      await api.patch("/onboarding/outlet", {
        outletName: data.outletName,
        outletAbbr: data.outletAbbr,
      });
    } catch (err: any) {
      // Check for 409 conflict (abbreviation already taken)
      if (err.message && err.message.includes("409")) {
        return {
          error:
            "This abbreviation is already in use. Please choose a different one.",
        };
      }
      return { error: err.message };
    }

    // Only reached if API call succeeded
    // Set cookie to mark outlet step as completed
    const cookieStore = await cookies();
    cookieStore.set("billit_onboarding_outlet", "true", {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      path: "/",
    });

    redirect(ROUTES.ONBOARDING_GST);
  },
);
