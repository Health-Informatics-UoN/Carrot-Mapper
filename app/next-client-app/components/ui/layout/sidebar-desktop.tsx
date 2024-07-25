"use client";

import { SidebarButton } from "./sidebar-button";

import Link from "next/link";

import { Carrot, LogOut, MoreHorizontal, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { Separator } from "../separator";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Button } from "../button";
import { SidebarItems } from "./sidebar";
import Image from "next/image";

interface SidebarDesktopProps {
  sidebarItems: SidebarItems;
}

export function SidebarDesktop(props: SidebarDesktopProps) {
  const pathname = usePathname();

  return (
    <aside className="w-[270px] max-w-xs h-screen fixed left-0 top-0 z-40 border-r">
      <div className="h-full px-3 py-4">
        <h3 className="mx-3 text-lg font-semibold text-foreground flex items-center">
          Carrot Mapper
          <Image
            width={25}
            height={25}
            src="/carrot-logo.png"
            alt="carrot-logo"
            className="ml-4"
          />
        </h3>
        <div className="mt-5">
          <div className="flex flex-col gap-1 w-full">
            {props.sidebarItems.links.map((link, index) => (
              <Link key={index} href={link.href}>
                <SidebarButton
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  icon={link.icon}
                  className="w-full"
                >
                  {link.label}
                </SidebarButton>
              </Link>
            ))}
            {props.sidebarItems.extras}
          </div>
          <div className="absolute left-0 bottom-3 w-full px-3">
            <Separator className="absolute -top-3 left-0 w-full" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex justify-between items-center w-full">
                    <MoreHorizontal size={20} />
                  </div>
                  <div>User Name</div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mb-2 w-56 p-3 rounded-[1rem]">
                <div className="space-y-1">
                  <Link href="/accounts/password_change/">
                    <SidebarButton size="sm" icon={Settings} className="w-full">
                      Change Password
                    </SidebarButton>
                  </Link>
                  <Link href="/accounts/logout/">
                    <SidebarButton size="sm" icon={LogOut} className="w-full">
                      Log Out
                    </SidebarButton>
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </aside>
  );
}
