"use client";

import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { FilterOption } from "@/types/filter";

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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface PartnersProps<TData, TValue> {
  title?: string;
  options: DataPartner[];
  selectedOption?: DataPartner;
  handleSelect: (option: DataPartner) => void;
}

export function SelectPartners<TData, TValue>({
  title,
  options,
  selectedOption,
  handleSelect,
}: PartnersProps<TData, TValue>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="">
          <PlusCircledIcon className="mr-2 size-4" />
          {title}
          {selectedOption && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge className="bg-carrot">
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
      <PopoverContent className="w-[12.5rem] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
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
                        "mr-2 flex w-4 h-4 items-center justify-center rounded-full border border-carrot",
                        isSelected
                          ? "bg-carrot text-white"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className="size-4" aria-hidden="true" />
                    </div>
                    <span>{option.name}</span>
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
