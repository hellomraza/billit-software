import GstToggleButton from "@/app/(dashboard)/components/gst-toggle-button";
import ToggleSidebarButton from "./sidebar/toggle-sidebar-button";
import NavButtons from "./nav-buttons";

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-10 flex gap-4 bg-background border-b px-4 md:px-2 items-center p-2">
      <ToggleSidebarButton />
      <div className="flex-1 flex items-center">
        {/* Responsive Mobile Trigger can go here */}
        <h2 className="text-lg font-semibold md:hidden text-primary">
          BillIt MVP
        </h2>
      </div>
      <NavButtons />
    </header>
  );
}
