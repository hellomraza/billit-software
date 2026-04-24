"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-sm border-0 sm:border">
      <CardHeader className="space-y-2 text-center pb-8 border-b-0">
        <h3 className="text-xl font-bold tracking-tight text-primary flex items-center justify-center gap-2">
          BillIt
        </h3>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm text-primary font-medium hover:underline text-center"
        >
          Forgot password?
        </Link>
      </CardFooter>
    </Card>
  );
}
