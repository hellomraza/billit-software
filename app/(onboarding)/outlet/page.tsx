"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatAbbreviation,
  generateSmartAbbreviation,
} from "@/lib/formatters/abbreviation";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

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
    // Auto-generate smart abbreviation if user hasn't manually entered one
    if (val.length > 0 && abbrev === "MAIN") {
      const generated = generateSmartAbbreviation(val);
      setAbbrev(generated);
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
        <div className="text-sm text-muted-foreground font-medium mb-1">
          Step 2 of 3
        </div>
        <CardTitle className="text-xl">Outlet Details</CardTitle>
        <CardDescription>Name this specific store location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
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
            onChange={(e) => setAbbrev(formatAbbreviation(e.target.value))}
            maxLength={4}
            required
          />
          <p className="text-xs text-muted-foreground">
            A 2-4 character identifier for this outlet location.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(ROUTES.ONBOARDING_BUSINESS)}
        >
          Back
        </Button>
        <Button onClick={handleContinue}>Continue</Button>
      </CardFooter>
    </Card>
  );
}
