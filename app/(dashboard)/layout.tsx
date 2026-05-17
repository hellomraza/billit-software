import { AppTopBar } from "@/components/shared/app-topbar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { OutletBootstrap } from "@/components/shared/outlet-bootstrap";
import UiSidebar from "@/components/shared/sidebar/ui-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <OutletBootstrap>
        <SidebarProvider>
          <UiSidebar />
          <SidebarInset className="md:max-w-[calc(100vw-16rem)] md:peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon)-(--spacing(4)))] transition-all duration-200 ease-linear">
            {/* Main content with responsive padding for sidebar */}
            <div className="flex flex-col flex-1 transition-all duration-300 ease-linear">
              <AppTopBar />
              <main className="p-4">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </OutletBootstrap>
    </ErrorBoundary>
  );
}
