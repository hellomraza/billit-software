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
    } catch (err: unknown) {
      // Check for 409 conflict (abbreviation already taken)
      if (err instanceof Error) {
        if (err.message && err.message.includes("409")) {
          return {
            error:
              "This abbreviation is already in use. Please choose a different one.",
          };
        }
        return { error: err.message };
      }
      return { error: "An unexpected error occurred" };
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
        name: data.outletName,
        abbr: data.outletAbbr,
      });
    } catch (err: unknown) {
      // Check for 409 conflict (abbreviation already taken)
      if (err instanceof Error) {
        if (err.message && err.message.includes("409")) {
          return {
            error:
              "This abbreviation is already in use. Please choose a different one.",
          };
        }
        return { error: err.message };
      }
      return { error: "An unexpected error occurred" };
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

// B.4 Update GST Information Schema
const onboardingGstSchema = z.object({
  gstNumber: z
    .string()
    .optional()
    .default("")
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // optional
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          val,
        );
      },
      {
        message:
          "GSTIN format looks incorrect, but you can still save and update later",
      },
    ),
});

// B.4 Update GST Information Action
export const updateOnboardingGstAction = validatedAction(
  onboardingGstSchema,
  async (data) => {
    try {
      const api = await createServerAxios();
      // PATCH /onboarding/gst with gstNumber
      await api.patch("/onboarding/gst", {
        gstNumber: data.gstNumber || "",
      });
      await completeOnboardingStepAction(); // Mark GST step as completed
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message };
      }
      return { error: "An unexpected error occurred" };
    }

    // Only reached if both API calls succeeded
    // Set cookie to mark onboarding as completed
    const cookieStore = await cookies();
    cookieStore.set("billit_onboarding_complete", "true", {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      path: "/",
    });

    redirect("/");
  },
);

export const completeOnboardingStepAction = async () => {
  // check if onboarding cookies are set, if not redirect to first incomplete step
  const cookieStore = await cookies();
  const businessCompleted = cookieStore.get(
    "billit_onboarding_business",
  )?.value;
  const outletCompleted = cookieStore.get("billit_onboarding_outlet")?.value;

  if (!businessCompleted) {
    redirect(ROUTES.ONBOARDING_BUSINESS);
  } else if (!outletCompleted) {
    redirect(ROUTES.ONBOARDING_OUTLET);
  }
  console.log("All onboarding steps completed, marking onboarding as complete");

  // call /onboarding/complete to mark onboarding as complete in backend
  try {
    const api = await createServerAxios();
    await api.post("/onboarding/complete");
  } catch (err) {
    console.log("Error marking onboarding complete:", err);
    // Even if this fails, we still want to set the cookie and redirect
  }

  // If all steps completed, mark onboarding as complete
  cookieStore.set("billit_onboarding_complete", "true", {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: "lax",
    path: "/",
  });

  console.log("Onboarding complete, redirecting to dashboard");

  redirect("/");
};
