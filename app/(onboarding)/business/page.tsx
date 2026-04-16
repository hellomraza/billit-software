"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/routes";

export default function BusinessSetupPage() {
  const router = useRouter();
  const { completeOnboardingStep, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [abbrev, setAbbrev] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.length > 0 && !abbrev) {
      setAbbrev(val.substring(0, 3).toUpperCase());
    }
  };

  const handleContinue = () => {
    setError(null);
    if (!name.trim()) {
      setError("Business name is required.");
      return;
    }
    if (!abbrev.trim()) {
      setError("Business abbreviation is required.");
      return;
    }
    completeOnboardingStep("business", {
      businessName: name.trim(),
      businessAbbreviation: abbrev.trim(),
    });
    router.push(ROUTES.ONBOARDING_OUTLET);
  };

  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">Step 1 of 3</div>
        <CardTitle className="text-xl">Business Identity</CardTitle>
        <CardDescription>What is the legal name of your business?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            placeholder="e.g. SuperMart Central"
            value={name}
            onChange={handleNameChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="abbrev">Business Abbreviation</Label>
          <Input
            id="abbrev"
            placeholder="SMC"
            value={abbrev}
            onChange={(e) => setAbbrev(e.target.value.toUpperCase())}
            maxLength={5}
            required
          />
          <p className="text-xs text-muted-foreground">
            A short prefix used for your official invoice numbers.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => router.push(ROUTES.AUTH_LOGIN)}>Cancel</Button>
        <Button onClick={handleContinue}>Continue</Button>
      </CardFooter>
    </Card>
  );
}
