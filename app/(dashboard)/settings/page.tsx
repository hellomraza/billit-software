import React from "react";
import { getTenant, getOutlet, getGSTSettings } from "@/lib/mock-data/tenant";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Settings | BillIt" };

export default async function SettingsPage() {
  const tenant = await getTenant();
  const outlet = await getOutlet();
  const gst = await getGSTSettings();

  return (
    <div className="flex flex-col space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your business account and configurations.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Basic details about your business entity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input defaultValue={tenant.businessName} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Business Abbreviation</Label>
                <Input defaultValue={tenant.businessAbbreviation} readOnly className="bg-muted/50 font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Outlet Name</Label>
                <Input defaultValue={outlet.outletName} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Outlet Abbreviation</Label>
                <Input defaultValue={outlet.outletAbbreviation} readOnly className="bg-muted/50 font-mono" />
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
                <Input defaultValue={gst.gstNumber || ""} placeholder="Not Registered" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Tax Details</Button>
          </CardFooter>
        </Card>

        <Separator />
        
        <div className="flex justify-start">
          <Link href="/login" className={buttonVariants({ variant: "destructive" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
