"use client";

import clsx from "clsx";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Item } from "./tab-group";
import { Button } from "../button";
import { cn } from "@/lib/utils";
import { SeparatorVertical } from "lucide-react";

export const Tab = ({
  path,
  parallelRoutesKey,
  item,
}: {
  path: string;
  parallelRoutesKey?: string;
  item: Item;
}) => {
  const segment = useSelectedLayoutSegment(parallelRoutesKey);
  const href = item.slug ? path + "/" + item.slug : path;
  const isActive =
    // Example home pages e.g. `/layouts`
    (!item.slug && segment === null) ||
    (!item.slug && segment === "tables") ||
    (!item.slug && segment === "fields") ||
    segment === item.segment ||
    // Nested pages e.g. `/layouts/electronics`
    segment === item.slug;

  return (
    <>
      {" "}
      <Link href={href}>
        <Button
          variant={"ghost"}
          className={cn("rounded-md px-0 py-1 text-xl", {
            "bg-white hover:text-carrot": !isActive,
            "hover:text-carrot/90 underline underline-offset-8 text-carrot":
              isActive,
          })}
        >
          {item.text}
        </Button>
      </Link>
      |
    </>
  );
};
