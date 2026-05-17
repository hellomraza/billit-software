"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  FileText,
  Package2,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Billing", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/deficits", label: "Deficits", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];

const UiSidebar = () => {
  const router = useRouter();

  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-16 items-center border-b  transition-all duration-300 ">
          <div className="flex items-center justify-start gap-2 font-bold text-xl text-primary px-2">
            <Package2 className="h-6 w-6" />
            <span className="group-data-[collapsible=icon]:opacity-0 transition-opacity transition-discrete block duration-200 group-data-[collapsible=icon]:delay-0 ease-linear">
              BillIt MVP
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(item.href)}
                    data-active={isActive ? "true" : "false"}
                    isActive={isActive}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 group-data-[collapsible=icon]:h-5",
                        {
                          "text-primary": isActive,
                          "text-muted-foreground": !isActive,
                        },
                      )}
                    />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t text-sm text-muted-foreground">
          <p>SMC Branch</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UiSidebar;
