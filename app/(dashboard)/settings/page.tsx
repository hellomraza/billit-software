"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getGSTSettings, getOutlet, getTenant } from "@/lib/mock-data/tenant";
import { validatePassword } from "@/lib/validators/auth";
import { KeyRound, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [outlet, setOutlet] = useState<any>(null);
  const [gst, setGst] = useState<any>(null);
  const [gstin, setGstin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { logout, updateTenantSettings } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTenant(), getOutlet(), getGSTSettings()]).then(
      ([t, o, g]) => {
        setTenant(t);
        setOutlet(o);
        setGst(g);
        setGstin(g.gstNumber || "");
      },
    );
  }, []);

  const handleSaveTax = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    updateTenantSettings({ gstNumber: gstin });
    setIsSaving(false);
    toast.success("Tax Config Saved", { description: "GST Details updated." });
  };

  const handleSavePassword = async () => {
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }

    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      setPasswordError(errors.join(" "));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSavingPassword(false);

    // Simulate successful change
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password Updated", {
      description: "Your account password has been changed.",
    });
  };

  const handleLogoutConfirm = () => {
    setShowLogout(false);
    logout();
  };

  if (!tenant || !outlet || !gst) {
    return (
      <div className="animate-pulse p-4 text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your business account and configurations.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Basic details about your business entity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  defaultValue={tenant.businessName}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Business Abbreviation</Label>
                <Input
                  defaultValue={tenant.businessAbbreviation}
                  readOnly
                  className="bg-muted/50 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Outlet Name</Label>
                <Input
                  defaultValue={outlet.outletName}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Outlet Abbreviation</Label>
                <Input
                  defaultValue={outlet.outletAbbreviation}
                  readOnly
                  className="bg-muted/50 font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax & GST Settings</CardTitle>
            <CardDescription>Update your tax registrations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="Not Registered"
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveTax} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Tax Details"}
            </Button>
          </CardFooter>
        </Card>

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
            <div className="max-w-md space-y-4">
              {passwordError && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
                  {passwordError}
                </div>
              )}
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
                <p className="text-[10px] text-muted-foreground">
                  Must be at least 8 characters long.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSavePassword}
              disabled={isSavingPassword}
              variant="default"
            >
              {isSavingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </Card>

        <Separator />

        <div className="flex justify-start">
          <Button variant="destructive" onClick={() => setShowLogout(true)}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>

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
