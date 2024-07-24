"use client";

import { BookMarked, Database, FileScan, Home, Upload } from "lucide-react";

// import { useMediaQuery } from "usehooks-ts";
// import { SidebarButton } from "./sidebar-button";
// import { SidebarMobile } from "./sidebar-mobile";
import { SidebarItems } from "@/types";
import { SidebarDesktop } from "./sidebar-desktop";

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
