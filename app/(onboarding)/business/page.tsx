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
import React, { useState } from "react";

export default function BusinessSetupPage() {
  const router = useRouter();
  const { completeOnboardingStep } = useAuth();
  const [name, setName] = useState("");
  const [abbrev, setAbbrev] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate smart abbreviation if user hasn't manually entered one
    if (val.length > 0 && !abbrev) {
      const generated = generateSmartAbbreviation(val);
      setAbbrev(generated);
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
        <div className="text-sm text-muted-foreground font-medium mb-1">
          Step 1 of 3
        </div>
        <CardTitle className="text-xl">Business Identity</CardTitle>
        <CardDescription>
          What is the legal name of your business?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
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
            onChange={(e) => setAbbrev(formatAbbreviation(e.target.value))}
            maxLength={4}
            required
          />
          <p className="text-xs text-muted-foreground">
            A 2-4 character prefix used for your official invoice numbers.
            Generated intelligently from your business name.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => router.push(ROUTES.AUTH_LOGIN)}>
          Cancel
        </Button>
        <Button onClick={handleContinue}>Continue</Button>
      </CardFooter>
    </Card>
  );
}
