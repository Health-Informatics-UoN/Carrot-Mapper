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

interface ProjectFacetedFilterProps<TData, TValue> {
  title?: string;
  options: Projects[];
  selectedOptions?: Projects[];
  handleSelect: (option: Projects) => void;
}

export function ProjectFacetsFilter<TData, TValue>({
  title,
  options,
  selectedOptions,
  handleSelect,
}: ProjectFacetedFilterProps<TData, TValue>) {
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
                        (selectedOption) => selectedOption.name === option.name
                      )
                    )
                    .map((option) => (
                      <Badge className="bg-carrot" key={option.name}>
                        {option.name}
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
                  (selectedOption) => selectedOption.name === option.name
                );

                return (
                  <CommandItem
                    key={option.name}
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
