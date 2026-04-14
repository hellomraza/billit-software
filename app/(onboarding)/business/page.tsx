"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function BusinessSetupPage() {
  const [name, setName] = useState("");
  const [abbrev, setAbbrev] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.length > 0 && !abbrev) {
      setAbbrev(val.substring(0, 3).toUpperCase());
    }
  };

  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">Step 1 of 3</div>
        <CardTitle className="text-xl">Business Identity</CardTitle>
        <CardDescription>What is the legal name of your business?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Cancel</Link>
        <Link href="/outlet" className={buttonVariants()}>Continue</Link>
      </CardFooter>
    </Card>
  );
}
