import React from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppTopbar } from "@/components/shared/app-topbar";
import { AuthGuard } from "@/components/shared/auth-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-muted/20">
        <AppSidebar />
        <div className="md:pl-64 flex flex-col min-h-screen">
          <AppTopbar />
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
