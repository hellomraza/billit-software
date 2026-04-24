import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppTopbar } from "@/components/shared/app-topbar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { OutletBootstrap } from "@/components/shared/outlet-bootstrap";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <OutletBootstrap>
        <div className="min-h-screen bg-muted/20">
          <AppSidebar />
          {/* Main content with responsive padding for sidebar */}
          <div className="md:pl-20 lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
            <AppTopbar />
            <main className="flex-1 p-4">{children}</main>
          </div>
        </div>
      </OutletBootstrap>
    </ErrorBoundary>
  );
}
