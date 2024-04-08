/* eslint-disable @next/next/no-img-element */

import React, { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

const navItems = [
  { name: "Home", link: "/" },
  { name: "Datasets", link: "" },
  {
    name: "Scan Reports",
    options: [
      { name: "Scan Reports", link: "/scan-reports" },
      { name: "New Scan Report Upload", link: "" },
    ],
  },
  { name: "Documentation", link: "" },
  { name: "Change Password", link: "" },
  { name: "Logout", link: "" },
];

interface NavMenuProps {
  options: { name: string; link: string }[];
  children: ReactNode;
}

function NavMenu({ options, children }: NavMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option, index) => (
          <div key={option.name}>
            <DropdownMenuItem key={index}>
              <a className="text-lg w-full h-full" href={option.link}>
                {option.name}
              </a>
            </DropdownMenuItem>
            {!(index >= options.length - 1) && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NavItemProps {
  name: string;
  link?: string;
}

function NavItem({ name, link }: NavItemProps) {
  return (
    <a
      href={link}
      className="flex items-center justify-center h-full w-fit pl-3 pr-3 text-xl text-black text-center no-underline hover:text-green-500 hover:border-b-2 hover:border-blue-700 cursor-pointer"
    >
      {name}
      {name === "Scan Reports" && <ChevronDownIcon className="h-6 w-6 ml-1" />}
    </a>
  );
}

export function Navbar() {
  return (
    <div className="h-16 shadow-xl">
      <div className="h-full flex items-center">
        <a href="/">
          <img
            className="text-center w-10 h-10 ml-5 mr-10"
            src="/coconnect-logo.png"
            alt="CaRROT"
          />
        </a>
        {navItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.options ? (
              <NavMenu options={item.options}>
                <NavItem name={item.name} />
              </NavMenu>
            ) : (
              <NavItem key={index} name={item.name} link={item.link} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
