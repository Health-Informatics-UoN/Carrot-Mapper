import Link from "next/link";
import Image from "next/image";

import { SidebarButton } from "./sidebar-button";
import { sidebarItems } from "./menuItems";
import { Sidebar } from "./sidebar";
import { ModeToggle } from "./mode-toggle";

export const MenuBar = ({ userName }: { userName: string }) => {
  return (
    <>
      <Sidebar onPublic userName={userName} />

      <div className="hidden lg:flex lg:items-center border-b-2 border-gray-300 justify-between bg-primary pt-4 px-8 pb-3">
        <Link href={"/"}>
          <div className="text-2xl flex items-center font-semibold">
            <Image
              width={22}
              height={22}
              src="/carrot-logo.png"
              alt="carrot-logo"
              className="mx-3"
            />
            Carrot
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex">
            {(userName === "Unknown User"
              ? sidebarItems.routes
              : sidebarItems.links
            ).map((link, idx) => (
              <Link key={idx} href={link.href}>
                <SidebarButton icon={link.icon} className="w-full">
                  {link.label}
                </SidebarButton>
              </Link>
            ))}
          </div>
          <div>
            <ModeToggle />
          </div>
          {/* TODO: Need a logout button here */}
        </div>
      </div>
    </>
  );
};
