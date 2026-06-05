import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/shared/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer lma-inline-flex lma-h-6 lma-w-11 shrink-0 lma-cursor-pointer lma-items-center lma-rounded-full lma-border-2 lma-border-transparent lma-transition-colors data-[state=checked]:lma-bg-primary data-[state=unchecked]:lma-bg-input focus-visible:outline-none focus-visible:lma-ring-2 focus-visible:lma-ring-ring focus-visible:lma-ring-offset-2 focus-visible:lma-ring-offset-background disabled:lma-cursor-not-allowed disabled:lma-opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "lma-pointer-events-none lma-block lma-h-5 lma-w-5 lma-rounded-full lma-bg-background lma-shadow-lg lma-ring-0 lma-transition-transform data-[state=checked]:lma-translate-x-5 data-[state=unchecked]:lma-translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
