"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function OutletSetupPage() {
  const [name, setName] = useState("Main Outlet");
  const [abbrev, setAbbrev] = useState("MAIN");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.length > 0 && !abbrev) {
      setAbbrev(val.substring(0, 4).toUpperCase());
    }
  };

  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">Step 2 of 3</div>
        <CardTitle className="text-xl">Outlet Details</CardTitle>
        <CardDescription>Name this specific store location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <Link href="/business" className={buttonVariants({ variant: "ghost" })}>Back</Link>
        <Link href="/gst" className={buttonVariants()}>Continue</Link>
      </CardFooter>
    </Card>
  );
}
