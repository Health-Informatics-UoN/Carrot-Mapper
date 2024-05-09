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
import { useEffect, useState } from "react";

interface DataTableFacetedFilterProps<TData, TValue> {
  title?: string;
  options: FilterOption[];
  filterFunction?: any;
}

export function FacetsFilter<TData, TValue>({
  title,
  options,
  filterFunction,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const [selectedOptions, setValues] = useState<FilterOption[]>([]);

  useEffect(() => {
    filterFunction(selectedOptions);
  }, [selectedOptions]);

  const handleSelect = (option: FilterOption) => {
    setValues((prevValues) => {
      const isSelected = selectedOptions.some(
        (item) => item.value === option.value,
      );

      if (isSelected) {
        return prevValues.filter((item) => item.value !== option.value);
      } else {
        return [...prevValues, option];
      }
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="">
          <PlusCircledIcon className="mr-2 size-4" />
          {title}
          {selectedOptions.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedOptions.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedOptions.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedOptions.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) =>
                      selectedOptions.some(
                        (selectedOption) =>
                          selectedOption.value === option.value,
                      ),
                    )
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
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
                const isSelected = selectedOptions.some(
                  (selectedOption) => selectedOption.value === option.value,
                );

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex size-4 items-center justify-center rounded-sm border border-carrot",
                        isSelected
                          ? "bg-carrot text-white"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className="size-4" aria-hidden="true" />
                    </div>
                    {option.icon && (
                      <option.icon
                        className="mr-2 size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedOptions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setValues([])}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
