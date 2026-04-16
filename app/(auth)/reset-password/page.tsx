"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/routes";
import { validatePassword } from "@/lib/validators/auth";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function ResetPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { valid, errors } = validatePassword(password);
    if (!valid) {
      setError(errors.join(" "));
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    // Mock network request with 1s delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="h-14 w-14 rounded-full bg-success/20 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Password reset successful
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Your password has been successfully reset. You can now log in with
          your new password.
        </p>
        <Link
          href={ROUTES.AUTH_LOGIN}
          className={buttonVariants({
            variant: "default",
            className: "mt-4 w-full",
          })}
        >
          Continue to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
        <p className="text-muted-foreground text-sm">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="••••••••"
          />
          <p className="text-[10px] text-muted-foreground">
            Must be at least 8 characters.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </div>
  );
}
