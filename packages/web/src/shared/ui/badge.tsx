import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "lma-inline-flex lma-items-center lma-rounded-full lma-border lma-px-2.5 lma-py-0.5 lma-text-xs lma-font-semibold lma-transition-colors focus:lma-outline-none focus:lma-ring-2 focus:lma-ring-ring focus:lma-ring-offset-2",
  {
    variants: {
      variant: {
        default: "lma-border-transparent lma-bg-primary lma-text-primary-foreground hover:lma-bg-primary/80",
        secondary: "lma-border-transparent lma-bg-secondary lma-text-secondary-foreground hover:lma-bg-secondary/80",
        destructive: "lma-border-transparent lma-bg-destructive lma-text-destructive-foreground hover:lma-bg-destructive/80",
        outline: "lma-text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
