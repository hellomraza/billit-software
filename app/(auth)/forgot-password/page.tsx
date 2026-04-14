"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MoveLeft, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          We've sent a password reset link to <strong className="text-foreground">{email}</strong>. 
          Please check your inbox and spam folder.
        </p>
        <Link href={ROUTES.AUTH_LOGIN} className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
        <p className="text-muted-foreground text-sm">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@example.com" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Reset password
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link href={ROUTES.AUTH_LOGIN} className="text-sm text-primary hover:underline font-medium inline-flex items-center">
          <MoveLeft className="mr-2 h-4 w-4" /> Back to login
        </Link>
      </div>
    </div>
  );
}
