"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/features/auth/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md shadow-sm border-0 sm:border">
      <CardHeader className="space-y-2 text-center pb-8">
        <h3 className="text-xl font-bold tracking-tight text-primary flex items-center justify-center gap-2">
          BillIt
        </h3>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Start managing your POS and inventory efficiently
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 mt-2">
        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Log in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
