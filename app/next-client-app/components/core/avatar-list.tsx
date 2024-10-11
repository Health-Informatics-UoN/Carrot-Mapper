"use client";
import { cn } from "@/lib/utils";
import { Tooltip } from "react-tooltip";

export function AvatarList({
  numPeople,
  names,
}: {
  numPeople: number;
  names: string[];
}) {
  return (
    <div className={cn("z-10 flex -space-x-4 rtl:space-x-reverse")}>
      {names.map((name, index) => (
        <a
          data-tooltip-id="icon-tooltip"
          data-tooltip-content={`${name}`}
          data-tooltip-place="top"
          className="flex justify-center"
        >
          <Tooltip id="icon-tooltip" />
          <div
            key={index}
            className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800 bg-black flex justify-left pl-2 items-center"
          >
            {name.charAt(0).toUpperCase()}
          </div>
        </a>
      ))}

      <a
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black text-center text-xs font-medium text-white hover:bg-gray-600 dark:border-gray-800 dark:bg-white dark:text-black"
        href=""
      >
        {numPeople}
      </a>
    </div>
  );
}
