import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carrot-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-carrot-950 dark:focus-visible:ring-carrot-300",
  {
    variants: {
      variant: {
        default:
          "bg-carrot-900 text-carrot-50 hover:bg-carrot-900/90 dark:bg-carrot-50 dark:text-carrot-900 dark:hover:bg-carrot-50/90",
        destructive:
          "bg-red-500 text-carrot-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-carrot-50 dark:hover:bg-red-900/90",
        outline:
          "border border-carrot-200 bg-white hover:bg-carrot-100 hover:text-carrot-900 dark:border-carrot-800 dark:bg-carrot-950 dark:hover:bg-carrot-800 dark:hover:text-carrot-50",
        secondary:
          "bg-carrot-100 text-carrot-900 hover:bg-carrot-100/80 dark:bg-carrot-800 dark:text-carrot-50 dark:hover:bg-carrot-800/80",
        ghost:
          "hover:bg-carrot-100 hover:text-carrot-900 dark:hover:text-white dark:text-carrot-400 dark:hover:bg-transparent",
        link: "text-carrot-900 underline-offset-4 hover:underline dark:text-carrot-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
