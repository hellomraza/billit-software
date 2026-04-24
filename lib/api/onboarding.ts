import { createServerAxios } from "@/lib/axios/server";
import { OnboardingStatus } from "@/lib/types/api";

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const api = await createServerAxios();
  const { data } = await api.get<OnboardingStatus>("/onboarding/status");
  return data;
}
