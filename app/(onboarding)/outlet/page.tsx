"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/routes";

export default function OutletSetupPage() {
  const router = useRouter();
  const { completeOnboardingStep } = useAuth();
  const [name, setName] = useState("Main Outlet");
  const [abbrev, setAbbrev] = useState("MAIN");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = localStorage.getItem("billit_onboarding_business");
    if (!prev) {
      router.push(ROUTES.ONBOARDING_BUSINESS);
    }
  }, [router]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.length > 0 && abbrev === "MAIN") {
      setAbbrev(val.substring(0, 4).toUpperCase());
    }
  };

  const handleContinue = () => {
    setError(null);
    if (!name.trim()) {
      setError("Outlet name is required.");
      return;
    }
    if (!abbrev.trim()) {
      setError("Outlet abbreviation is required.");
      return;
    }
    completeOnboardingStep("outlet", {
      outletName: name.trim(),
      outletAbbreviation: abbrev.trim(),
    });
    router.push(ROUTES.ONBOARDING_GST);
  };

  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">Step 2 of 3</div>
        <CardTitle className="text-xl">Outlet Details</CardTitle>
        <CardDescription>Name this specific store location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="outletName">Outlet Name</Label>
          <Input
            id="outletName"
            placeholder="e.g. Downtown Branch"
            value={name}
            onChange={handleNameChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="abbrev">Outlet Abbreviation</Label>
          <Input
            id="abbrev"
            placeholder="DTB"
            value={abbrev}
            onChange={(e) => setAbbrev(e.target.value.toUpperCase())}
            maxLength={5}
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => router.push(ROUTES.ONBOARDING_BUSINESS)}>Back</Button>
        <Button onClick={handleContinue}>Continue</Button>
      </CardFooter>
    </Card>
  );
}
