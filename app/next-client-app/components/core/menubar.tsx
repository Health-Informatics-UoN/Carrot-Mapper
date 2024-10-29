import Link from "next/link";
import { SidebarButton } from "./sidebar-button";
import { sidebarItems } from "./menuItems";
import { Sidebar } from "./sidebar";
import { ModeToggle } from "./mode-toggle";
import { LogOut } from "lucide-react";

export const MenuBar = ({ userLoggedIn }: { userLoggedIn: boolean }) => {
  return (
    <>
      <Sidebar onPublic userLoggedIn={userLoggedIn} />
      <div className="hidden lg:flex lg:items-center sticky top-0 z-50 backdrop-blur border-b-2 border-gray-300 justify-between bg-primary pt-4 px-8 pb-3">
        <Link href={"/"}>
          <div className="text-2xl flex items-center font-semibold">
            <img
              className="mx-3 w-[25px]"
              src="/carrot-logo.png"
              alt="carrot-logo"
            />
            Carrot
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex">
            {(!userLoggedIn ? sidebarItems.routes : sidebarItems.links).map(
              (link, idx) => (
                <Link key={idx} href={link.href}>
                  <SidebarButton icon={link.icon} className="w-full">
                    {link.label}
                  </SidebarButton>
                </Link>
              )
            )}
            {userLoggedIn && (
              <a href={"/accounts/logout/"}>
                <SidebarButton icon={LogOut} className="w-full">
                  {"Log out"}
                </SidebarButton>
              </a>
            )}
          </div>
          <div>
            <ModeToggle />
          </div>
        </div>
      </div>
    </>
  );
};
