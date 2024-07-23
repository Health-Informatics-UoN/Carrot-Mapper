"use client";

import clsx from "clsx";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Item } from "./tab-group";
import { Button } from "../button";
import { cn } from "@/lib/utils";

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
    <Link href={href}>
      <Button
        variant={"outline"}
        className={cn("rounded-md px-3 py-1", {
          "bg-white hover:text-carrot": !isActive,
          "bg-carrot text-white hover:bg-carrot/90": isActive,
        })}
      >
        {item.text}
      </Button>
    </Link>
  );
};
