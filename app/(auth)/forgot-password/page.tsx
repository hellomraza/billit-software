"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/routes";
import { validateEmail } from "@/lib/validators/auth";
import { Loader2, Mail, MoveLeft } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [resendCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);
    // Mock API with 1s delay for email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSubmitted(true);
    setResendCountdown(60); // 60 second cooldown for resend
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setIsLoading(true);
    // Simulate resending email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setResendCountdown(60);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="h-14 w-14 rounded-full bg-success/20 flex items-center justify-center mb-2">
          <Mail className="h-7 w-7 text-success" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          We've sent a password reset link to{" "}
          <strong className="text-foreground">{email}</strong>. Please check
          your inbox and spam folder.
        </p>

        {/* Expiration notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 max-w-sm text-sm text-amber-900 mt-4">
          <p className="font-medium mb-1">⏰ Link expires in 24 hours</p>
          <p className="text-amber-800">
            The password reset link will expire in 24 hours for security
            purposes.
          </p>
        </div>

        {/* Resend button */}
        <div className="flex flex-col gap-2 w-full mt-4">
          <Button
            onClick={handleResend}
            variant="outline"
            disabled={resendCountdown > 0 || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCountdown > 0 ? (
              `Resend in ${resendCountdown}s`
            ) : (
              "Resend email"
            )}
          </Button>

          <Link
            href={ROUTES.AUTH_LOGIN}
            className={buttonVariants({
              variant: "ghost",
              className: "w-full",
            })}
          >
            Back to login
          </Link>
        </div>
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
        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link
          href={ROUTES.AUTH_LOGIN}
          className="text-sm text-primary hover:underline font-medium inline-flex items-center"
        >
          <MoveLeft className="mr-2 h-4 w-4" /> Back to login
        </Link>
      </div>
    </div>
  );
}
