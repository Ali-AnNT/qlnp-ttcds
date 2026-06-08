import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "lma-inline-flex lma-items-center lma-justify-center lma-gap-2 lma-whitespace-nowrap lma-rounded-md lma-text-sm lma-font-medium lma-ring-offset-background lma-transition-colors focus-visible:lma-outline-none focus-visible:lma-ring-2 focus-visible:lma-ring-ring focus-visible:lma-ring-offset-2 disabled:lma-pointer-events-none disabled:lma-opacity-50 [&_svg]:lma-pointer-events-none [&_svg]:lma-size-4 [&_svg]:lma-shrink-0",
  {
    variants: {
      variant: {
        default: "lma-bg-primary lma-text-primary-foreground hover:lma-bg-primary/90",
        destructive: "lma-bg-destructive lma-text-destructive-foreground hover:lma-bg-destructive/90",
        outline: "lma-border lma-border-input lma-bg-background hover:lma-bg-accent hover:lma-text-accent-foreground",
        secondary: "lma-bg-secondary lma-text-secondary-foreground hover:lma-bg-secondary/80",
        ghost: "hover:lma-bg-accent hover:lma-text-accent-foreground",
        link: "lma-text-primary lma-underline-offset-4 hover:lma-underline",
      },
      size: {
        default: "lma-h-10 lma-px-4 lma-py-2",
        sm: "lma-h-9 lma-rounded-md lma-px-3",
        lg: "lma-h-11 lma-rounded-md lma-px-8",
        icon: "lma-h-10 lma-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} type={type} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
