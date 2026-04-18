"use client";

import { logoutAction } from "@/actions/auth";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BusinessSettingsForm } from "@/features/settings/business-settings-form";
import { ChangePasswordForm } from "@/features/settings/change-password-form";
import { GstSettingsForm } from "@/features/settings/gst-settings-form";
import { clearAuthSession } from "@/lib/auth-tokens";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { KeyRound, Laptop, LogOut, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsScreenProps {
  settings: any;
}

export function SettingsScreen({ settings }: SettingsScreenProps) {
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const { theme, setTheme, mounted } = useDarkMode();

  const handleLogoutConfirm = async () => {
    setShowLogout(false);
    await logoutAction();
    clearAuthSession();
    router.push("/login");
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    const themeLabel =
      newTheme === "light" ? "Light" : newTheme === "dark" ? "Dark" : "System";
    toast.success("Theme Updated", {
      description: `Switched to ${themeLabel} mode.`,
    });
  };

  const abbrLocked = settings?.abbrLocked ?? false;

  return (
    <div className="flex flex-col space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your business account and configurations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Business Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Update your business name and manage abbreviation settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <BusinessSettingsForm
                businessName={settings?.businessName}
                businessAbbr={settings?.businessAbbr}
                abbrLocked={abbrLocked}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax & GST Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tax & GST Settings</CardTitle>
            <CardDescription>
              Configure your GST registration and tax settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <GstSettingsForm
                gstNumber={settings?.gstNumber || ""}
                gstEnabled={settings?.gstEnabled ?? false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your account security credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md">
              <ChangePasswordForm />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Customize your visual experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Theme</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose how BillIt appears on your screen.
              </p>
              {mounted && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange("system")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "system"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Laptop className="h-6 w-6" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                <strong>System:</strong> Automatically matches your device
                settings • <strong>Light:</strong> Always use light mode •{" "}
                <strong>Dark:</strong> Always use dark mode
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Sign Out Button */}
        <div className="flex justify-start">
          <Button variant="destructive" onClick={() => setShowLogout(true)}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLogout}
        title="Sign out of BillIt?"
        description="Your current active cart session will be cleared."
        confirmText="Sign Out"
        isDangerous={true}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}
