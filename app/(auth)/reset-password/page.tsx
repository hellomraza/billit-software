import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // No token provided - show invalid state
  if (!token) {
    return (
      <Card className="w-full p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">
            The password reset link is invalid or has expired.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            You can request a new password reset link.
          </p>

          <Link href="/forgot-password" className="block w-full">
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium">
              Request New Link
            </button>
          </Link>

          <Link href="/login" className="block w-full">
            <button className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 font-medium">
              Back to Login
            </button>
          </Link>
        </div>
      </Card>
    );
  }

  // Token provided - show form
  return (
    <Card className="w-full p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter a new password to regain access to your account.
        </p>
      </div>

      <ResetPasswordForm token={token} />

      <div className="text-center">
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </Card>
  );
}
