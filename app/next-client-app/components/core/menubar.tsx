import Link from "next/link";
import { SidebarButton } from "./sidebar-button";
import { sidebarItems } from "./menuItems";
import { Sidebar } from "./sidebar";
import { ModeToggle } from "./mode-toggle";
import { CircleUserRound, LogOut, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

export const MenuBar = ({ user }: { user: User | null }) => {
  return (
    <>
      <Sidebar userName={user?.username} />
      <div className="hidden lg:flex lg:items-center sticky top-0 z-50 backdrop-blur border-b-2 border-gray-300 justify-between p-4 mb-4">
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
              <div>
                <Popover>
                  <PopoverTrigger>
                    <div className="mx-4">
                      <CircleUserRound className="size-5 mt-2 dark:text-carrot-400" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[12.5rem] my-2 p-2">
                    <div className="flex flex-col mt-2">
                      <div className="flex text-sm font-medium justify-center">
                        <span>Hi, {user.username}</span>
                      </div>
                      <Separator className="w-full my-2" />
                      <a
                        href="/accounts/password_change/"
                        className="flex items-center"
                      >
                        <Button variant={"ghost"} size={"sm"}>
                          <Settings className="size-4 mr-2" />
                          Change Password
                        </Button>
                      </a>
                      <a
                        href={"/accounts/logout/"}
                        className="flex items-center"
                      >
                        <Button variant={"ghost"} size={"sm"}>
                          <LogOut className="size-4 mr-2" />
                          Log Out
                        </Button>
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
