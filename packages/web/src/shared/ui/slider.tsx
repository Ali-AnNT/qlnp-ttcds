import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/shared/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("lma-relative lma-flex lma-w-full touch-none lma-select-none lma-items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="lma-relative lma-h-2 lma-w-full grow lma-overflow-hidden lma-rounded-full lma-bg-secondary">
      <SliderPrimitive.Range className="lma-absolute lma-h-full lma-bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="lma-block lma-h-5 lma-w-5 lma-rounded-full lma-border-2 lma-border-primary lma-bg-background lma-ring-offset-background lma-transition-colors focus-visible:outline-none focus-visible:lma-ring-2 focus-visible:lma-ring-ring focus-visible:lma-ring-offset-2 disabled:lma-pointer-events-none disabled:lma-opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
