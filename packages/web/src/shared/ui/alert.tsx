import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const alertVariants = cva(
  "lma-relative lma-w-full lma-rounded-lg lma-border !lma-p-4 [&>svg~*]:lma-pl-7 [&>svg+div]:lma-translate-y-[-3px] [&>svg]:lma-absolute [&>svg]:lma-left-4 [&>svg]:lma-top-4 [&>svg]:lma-text-foreground",
  {
    variants: {
      variant: {
        default: "lma-bg-background lma-text-foreground",
        destructive:
          "lma-border-destructive/50 lma-text-destructive dark:lma-border-destructive [&>svg]:lma-text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("lma-mb-1 lma-font-medium lma-leading-none lma-tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("lma-text-sm [&_p]:lma-leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
