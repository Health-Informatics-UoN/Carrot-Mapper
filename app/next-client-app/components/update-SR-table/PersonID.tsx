"use client";

import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ShortFields } from "./UpdateForm";
import { CircleUserRound } from "lucide-react";

interface PersonIDProps<TData, TValue> {
  title?: string;
  options: ShortFields[];
  selectedOption?: ShortFields;
  handleSelect: (option: ShortFields) => void;
}

export function PersonID<TData, TValue>({
  title,
  options,
  selectedOption,
  handleSelect,
}: PersonIDProps<TData, TValue>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-lg h-15">
          <CircleUserRound className="mr-2 size-5" />
          {title}
          {selectedOption && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge className="bg-carrot text-lg">
                {" "}
                {options
                  .filter((option) => selectedOption.name === option.name)
                  .map((option, index) => (
                    <div key={index}>{option.name}</div>
                  ))}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[50vw] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} className="text-lg" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedOption?.name === option.name;

                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleSelect(option)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex w-5 h-5 items-center justify-center rounded-full border border-carrot",
                        isSelected
                          ? "bg-carrot text-white"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon aria-hidden="true" />
                    </div>
                    <span className="text-lg">{option.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
