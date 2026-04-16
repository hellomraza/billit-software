import { OnboardingGuard } from "@/components/shared/onboarding-guard";
import React from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <div className="flex min-h-screen flex-col items-center pt-16 bg-muted/20 p-4">
        <div className="w-full max-w-lg mb-8 text-center transition-all">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Setup Your Business
          </h1>
        </div>
        {children}
      </div>
    </OnboardingGuard>
  );
}
