import { getOnboardingStatus } from "@/lib/api/onboarding";
import { redirect } from "next/navigation";
import React from "react";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get onboarding status from backend
  const onboardingStatus = await getOnboardingStatus();

  // If onboarding is already completed, redirect to home
  if (onboardingStatus.completed) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center pt-16 bg-muted/20 p-4">
      <div className="w-full max-w-lg mb-8 text-center transition-all">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Setup Your Business
        </h1>
      </div>
      {children}
    </div>
  );
}
