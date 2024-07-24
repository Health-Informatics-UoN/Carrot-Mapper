"use client";

// import { useMediaQuery } from "usehooks-ts";
// import { SidebarButton } from "./sidebar-button";
// import { SidebarMobile } from "./sidebar-mobile";
import { BookMarked, Database, FileScan, Home, Upload } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { SidebarDesktop } from "./sidebar-desktop";
export interface SidebarItems {
  links: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
  }>;
  extras?: ReactNode;
}

const sidebarItems: SidebarItems = {
  links: [
    { label: "Home", href: "/", icon: Home },
    { label: "Datasets", href: "/datasets/", icon: Database },
    { label: "Scan Reports", href: "/scanreports/", icon: FileScan },
    {
      label: "Upload New Scan Report",
      href: "/scanreports/create/",
      icon: Upload,
    },
    {
      href: "https://carrot4omop.ac.uk",
      icon: BookMarked,
      label: "Documentation",
    },
  ],
};

export function Sidebar() {
  return <SidebarDesktop sidebarItems={sidebarItems} />;
}
