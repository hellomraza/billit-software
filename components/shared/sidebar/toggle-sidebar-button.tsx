"use client";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";

const ToggleSidebarButton = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-primary"
      onClick={toggleSidebar}
    >
      <PanelLeft className="size-5 text-primary font-bold" />
    </Button>
  );
};

export default ToggleSidebarButton;
