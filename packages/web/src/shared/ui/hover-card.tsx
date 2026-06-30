import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import { cn } from "@/shared/lib/utils";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "lma-z-50 lma-w-64 lma-rounded-md lma-border lma-bg-popover !lma-p-4 lma-text-popover-foreground lma-shadow-md outline-none data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[side=bottom]:lma-slide-in-from-top-2 data-[side=left]:lma-slide-in-from-right-2 data-[side=right]:lma-slide-in-from-left-2 data-[side=top]:lma-slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
