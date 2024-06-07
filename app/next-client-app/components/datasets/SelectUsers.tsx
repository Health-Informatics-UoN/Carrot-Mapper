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

interface UsersProps<TData, TValue> {
  title?: string;
  options: Users[];
  selectedOptions?: Users[];
  handleSelect: (option: Users) => void;
}

export function SelectUsers<TData, TValue>({
  title,
  options,
  selectedOptions,
  handleSelect,
}: UsersProps<TData, TValue>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="">
          <PlusCircledIcon className="mr-2 size-4" />
          {title}
          {selectedOptions && selectedOptions?.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedOptions?.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedOptions?.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedOptions?.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) =>
                      selectedOptions?.some(
                        (selectedOption) =>
                          selectedOption.username === option.username
                      )
                    )
                    .map((option) => (
                      <Badge className="bg-carrot" key={option.id}>
                        {option.username}
                      </Badge>
                    ))
                )}
              </div>
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
                const isSelected = selectedOptions?.some(
                  (selectedOption) =>
                    selectedOption.username === option.username
                );

                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleSelect(option)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex size-4 items-center justify-center rounded-sm border border-carrot",
                        isSelected
                          ? "bg-carrot text-white"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className="size-4" aria-hidden="true" />
                    </div>
                    <span>{option.username}</span>
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
