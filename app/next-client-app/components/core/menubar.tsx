import Link from "next/link";
import Image from "next/image";
import { SidebarButton } from "./sidebar-button";
import { sidebarItems } from "./menuItems";
import { Sidebar } from "./sidebar";
import { ModeToggle } from "./mode-toggle";
import { LogOut } from "lucide-react";

export const MenuBar = ({ userIsLogged }: { userIsLogged: boolean }) => {
  return (
    <>
      <Sidebar onPublic userLoggedIn={userIsLogged} />
      <div className="hidden lg:flex lg:items-center sticky top-0 z-50 backdrop-blur border-b-2 border-gray-300 justify-between bg-primary pt-4 px-8 pb-3">
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
            {(!userIsLogged ? sidebarItems.routes : sidebarItems.links).map(
              (link, idx) => (
                <Link key={idx} href={link.href}>
                  <SidebarButton icon={link.icon} className="w-full">
                    {link.label}
                  </SidebarButton>
                </Link>
              )
            )}
            {userIsLogged && (
              <Link href={"/accounts/logout/"}>
                <SidebarButton icon={LogOut} className="w-full">
                  {"Log out"}
                </SidebarButton>
              </Link>
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
