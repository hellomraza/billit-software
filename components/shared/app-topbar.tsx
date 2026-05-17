import { Bell, User } from "lucide-react";
import { Button } from "../ui/button";
import ToggleSidebarButton from "./sidebar/toggle-sidebar-button";

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-18 gap-4 bg-background border-b px-4 md:px-6 items-center">
      <ToggleSidebarButton />
      <div className="flex-1 flex items-center">
        {/* Responsive Mobile Trigger can go here */}
        <h2 className="text-lg font-semibold md:hidden text-primary">
          BillIt MVP
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          <span
            className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive"
            aria-hidden="true"
          ></span>
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
