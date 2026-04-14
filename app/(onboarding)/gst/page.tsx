"use client";

import React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function GSTSetupPage() {
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
          />
          <p className="text-xs text-muted-foreground">
            You can always add or update this later in Settings.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href="/outlet" className={buttonVariants({ variant: "ghost" })}>Back</Link>
        <Link href="/" className={buttonVariants()}>Finish Setup</Link>
      </CardFooter>
    </Card>
  );
}
