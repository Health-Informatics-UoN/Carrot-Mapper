import Link from "next/link";
import { SidebarButton } from "./sidebar-button";
import { sidebarItems } from "./menuItems";
import { Sidebar } from "./sidebar";
import { ModeToggle } from "./mode-toggle";
import { CircleUserRound, LogOut, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

export const MenuBar = ({ user }: { user: User | null }) => {
  return (
    <>
      <Sidebar userName={user?.username} />
      <div className="hidden lg:flex lg:items-center sticky top-0 z-50 backdrop-blur border-b-2 border-gray-300 justify-between p-5 mb-5">
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
          <div className="flex items-center">
            {(!user ? sidebarItems.routes : sidebarItems.links).map(
              (link, idx) => (
                <Link key={idx} href={link.href}>
                  <SidebarButton icon={link.icon} className="w-full">
                    {link.label}
                  </SidebarButton>
                </Link>
              )
            )}
            {user && (
              // <a href={"/accounts/logout/"}>
              //   <SidebarButton icon={LogOut} className="w-full">
              //     {"Log out"}
              //   </SidebarButton>
              // </a>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex justify-between items-center mx-4">
                      <CircleUserRound className="size-5" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[12.5rem] my-2 p-2">
                    <div className="flex flex-col space-y-2 mt-2">
                      <div className="flex gap-2">
                        <span>Hi, {user.username}</span>
                      </div>
                      <Separator className="w-full" />
                      <a
                        href="/accounts/password_change/"
                        className="flex items-center"
                      >
                        Change Password <Settings className="size-4 ml-2" />
                      </a>
                      <a
                        href={"/accounts/logout/"}
                        className="flex items-center"
                      >
                        Log Out
                        <LogOut className="size-4 ml-2" />
                      </a>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
