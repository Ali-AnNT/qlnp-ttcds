import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const toggleVariants = cva(
  "lma-inline-flex lma-items-center lma-justify-center lma-rounded-md lma-text-sm lma-font-medium lma-ring-offset-background lma-transition-colors hover:lma-bg-muted hover:lma-text-muted-foreground focus-visible:outline-none focus-visible:lma-ring-2 focus-visible:lma-ring-ring focus-visible:lma-ring-offset-2 disabled:lma-pointer-events-none disabled:lma-opacity-50 data-[state=on]:lma-bg-accent data-[state=on]:lma-text-accent-foreground",
  {
    variants: {
      variant: {
        default: "lma-bg-transparent",
        outline: "lma-border lma-border-input lma-bg-transparent hover:lma-bg-accent hover:lma-text-accent-foreground",
      },
      size: {
        default: "lma-h-10 lma-px-3",
        sm: "lma-h-9 lma-px-2.5",
        lg: "lma-h-11 lma-px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
