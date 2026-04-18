"use client";

import clientAxios from "@/lib/axios/client";
import { OnboardingStatus } from "@/lib/types/api";

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const { data } = await clientAxios.get("/onboarding/status");
    return data;
  } catch (err) {
    console.error("Failed to fetch onboarding status:", err);
    return null;
  }
}
