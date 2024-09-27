import { LogOut, Settings } from "lucide-react";
import { getServerSession } from "next-auth";

import { LoginButton, LogoutButton } from "@/auth/login";
import { options } from "@/auth/options";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function UserMenu() {
  const session = await getServerSession(options);

  if (!session) {
    return <LoginButton />;
  }

  const initials =
    session.user?.name
      ?.split(" ")
      .map((word) => word[0].toUpperCase())
      .join("") ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {session.user?.name}
          {/* <Avatar className="ml-2">
            <AvatarImage
              src={session.user?.image ?? ""}
              alt={session.user?.name ?? ""}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar> */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* TODO: Add change password here */}
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Settings className="icon-md mr-2" />
            <span>Change Password</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <LogOut className="icon-md mr-2" />
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
