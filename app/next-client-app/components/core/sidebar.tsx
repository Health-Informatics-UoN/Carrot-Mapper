"use client";

import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import {
  BookMarked,
  FileScan,
  Folders,
  LogOut,
  LucideIcon,
  Menu,
  MoreHorizontal,
  Settings,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { SidebarButton } from "./sidebar-button";
import { usePathname } from "next/navigation";
import { Separator } from "../ui/separator";
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/drawer";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";

interface SidebarItems {
  links: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
  }>;
}

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const sidebarItems: SidebarItems = {
    links: [
      { label: "Datasets", href: "/datasets/", icon: Folders },
      { label: "Scan Reports", href: "/scanreports/", icon: FileScan },
      {
        label: "Upload Scan Report",
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

  return (
    <div className="flex gap-3 pt-4 px-10 items-center justify-between border-b-2 border-gray-300 pb-3 dark:bg-orange-200/80">
      <div className="flex items-center">
        <div className="flex items-center">
          {" "}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu size={25} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="px-3 py-4 w-[350px]">
              <SheetHeader className="flex flex-row justify-between items-center rounded-lg dark:bg-orange-200/80 w-full py-3">
                <Link href={"/scanreports"}>
                  <div className="text-3xl text-orange-500 flex items-center font-bold">
                    <Image
                      width={25}
                      height={25}
                      src="/carrot-logo.png"
                      alt="carrot-logo"
                      className="mx-3"
                    />
                    Carrot
                  </div>
                </Link>
              </SheetHeader>
              <div className="h-full">
                <div className="flex mt-7 flex-col w-full gap-1">
                  {sidebarItems.links.map((link, idx) => (
                    <Link key={idx} href={link.href}>
                      <SidebarButton
                        variant={pathname === link.href ? "secondary" : "ghost"}
                        icon={link.icon}
                        className="w-full"
                      >
                        {link.label}
                      </SidebarButton>
                    </Link>
                  ))}
                </div>
                <div className="absolute w-full bottom-4 px-1 left-0">
                  <Separator className="absolute -top-3 left-0 w-full" />
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex gap-2">
                            <span>{userName}</span>
                          </div>
                          <MoreHorizontal size={20} />
                        </div>
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="mb-2 p-2 w-[350px]">
                      <div className="flex flex-col space-y-2 mt-2">
                        <Link href="/accounts/password_change/">
                          <SidebarButton
                            size="sm"
                            icon={Settings}
                            className="w-full"
                          >
                            Change Password
                          </SidebarButton>
                        </Link>
                        <Link href={"/accounts/logout/"}>
                          <SidebarButton
                            size="sm"
                            icon={LogOut}
                            className="w-full"
                          >
                            Log Out
                          </SidebarButton>
                        </Link>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* TODO: Need to confirm again this link */}
        <Link href={"/scanreports"}>
          <div className="text-3xl text-orange-500 flex items-center font-bold">
            <Image
              width={25}
              height={25}
              src="/carrot-logo.png"
              alt="carrot-logo"
              className="mx-3"
            />
            Carrot
          </div>
        </Link>
      </div>
      <div className="justify-end">
        <ModeToggle />
      </div>
    </div>
  );
}
