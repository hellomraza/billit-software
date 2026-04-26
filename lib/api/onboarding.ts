import { createServerAxios } from "@/lib/axios/server";
import { OnboardingStatus } from "@/lib/types/api";
import { cookies } from "next/headers";

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant_id")?.value;
  if (!tenantId) {
    // If tenant_id cookie is missing, treat as not onboarded
    return {
      businessStep: false,
      outletStep: false,
    };
  }
  const api = await createServerAxios();
  const { data } = await api.get<OnboardingStatus>(
    `tenants/${tenantId}/onboarding/status`,
  );
  return data;
}
