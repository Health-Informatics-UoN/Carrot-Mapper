import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button, ButtonProps } from "../ui/button";
import { SheetClose } from "../ui/sheet";

interface SidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
}

export function SidebarButton({
  icon: Icon,
  className,
  children,
  ...props
}: SidebarButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn("gap-2 justify-start focus-visible:ring-0", className)}
      {...props}
    >
      {Icon && <Icon size={20} />}
      <span>{children}</span>
    </Button>
  );
}
