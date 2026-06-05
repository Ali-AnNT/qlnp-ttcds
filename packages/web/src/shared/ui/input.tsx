import * as React from "react";

import { cn } from "@/shared/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "lma-flex lma-h-10 lma-w-full lma-rounded-md lma-border lma-border-input lma-bg-background lma-px-3 lma-py-2 lma-text-base lma-ring-offset-background file:lma-border-0 file:lma-bg-transparent file:lma-text-sm file:lma-font-medium file:lma-text-foreground placeholder:lma-text-muted-foreground focus-visible:outline-none focus-visible:lma-ring-2 focus-visible:lma-ring-ring focus-visible:lma-ring-offset-2 disabled:lma-cursor-not-allowed disabled:lma-opacity-50 md:lma-text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
