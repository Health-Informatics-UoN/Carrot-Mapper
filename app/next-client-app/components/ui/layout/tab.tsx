"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Item } from "./tab-group";
import { Button } from "../button";
import { cn } from "@/lib/utils";
import {
  LucideIcon,
  FileScan,
  View,
  Ruler,
  Table,
  Waypoints,
  TableProperties,
  SearchCheck,
} from "lucide-react";

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
  const iconMap: { [key: string]: LucideIcon } = {
    SearchCheck,
    Waypoints,
    TableProperties,
  };

  const Icon = item.iconName ? iconMap[item.iconName] : null;

  return (
    <>
      {" "}
      <Link href={href}>
        <Button
          variant={"ghost"}
          className={cn("rounded-md px-0 py-1 text-xl", {
            "bg-white hover:text-carrot": !isActive,
            "hover:bg-white hover:text-carrot/90 underline underline-offset-8 text-carrot":
              isActive,
          })}
        >
          {item.text} {Icon && <Icon className="ml-2 size-5" />}
        </Button>
      </Link>
      |
    </>
  );
};
