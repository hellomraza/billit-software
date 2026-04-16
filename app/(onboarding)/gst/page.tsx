"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";

export default function GSTSetupPage() {
  const router = useRouter();
  const { completeOnboardingStep, finishOnboarding } = useAuth();
  const [gstin, setGstin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const prevBusiness = localStorage.getItem("billit_onboarding_business");
    const prevOutlet = localStorage.getItem("billit_onboarding_outlet");
    if (!prevBusiness) {
      router.push(ROUTES.ONBOARDING_BUSINESS);
    } else if (!prevOutlet) {
      router.push(ROUTES.ONBOARDING_OUTLET);
    }
  }, [router]);

  const handleFinish = async () => {
    setIsLoading(true);
    completeOnboardingStep("gst", { gstNumber: gstin.trim() });
    await new Promise(resolve => setTimeout(resolve, 600));
    toast.success("Setup complete!", { description: "Your business is ready to go." });
    finishOnboarding();
  };

  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">Step 3 of 3</div>
        <CardTitle className="text-xl">Tax Configuration</CardTitle>
        <CardDescription>Enter your GST details if applicable.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN (Optional)</Label>
          <Input
            id="gstin"
            placeholder="e.g. 22AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            You can always add or update this later in Settings.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => router.push(ROUTES.ONBOARDING_OUTLET)} disabled={isLoading}>Back</Button>
        <Button onClick={handleFinish} disabled={isLoading}>
          {isLoading ? "Setting up..." : "Finish Setup"}
        </Button>
      </CardFooter>
    </Card>
  );
}
