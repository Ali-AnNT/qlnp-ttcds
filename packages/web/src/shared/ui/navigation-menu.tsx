import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn("lma-relative lma-z-10 lma-flex lma-max-w-max lma-flex-1 lma-items-center lma-justify-center", className)}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn("group lma-flex lma-flex-1 lma-list-none lma-items-center lma-justify-center lma-space-x-1", className)}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  "group lma-inline-flex lma-h-10 lma-w-max lma-items-center lma-justify-center lma-rounded-md lma-bg-background lma-px-4 lma-py-2 lma-text-sm lma-font-medium lma-transition-colors hover:lma-bg-accent hover:lma-text-accent-foreground focus:lma-bg-accent focus:lma-text-accent-foreground focus:lma-outline-none disabled:lma-pointer-events-none disabled:lma-opacity-50 data-[active]:lma-bg-accent/50 data-[state=open]:lma-bg-accent/50",
);

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="lma-relative lma-top-[1px] lma-ml-1 lma-h-3 lma-w-3 lma-transition lma-duration-200 group-data-[state=open]:lma-rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "lma-left-0 lma-top-0 lma-w-full data-[motion^=from-]:lma-animate-in data-[motion^=to-]:lma-animate-out data-[motion^=from-]:lma-fade-in data-[motion^=to-]:lma-fade-out data-[motion=from-end]:lma-slide-in-from-right-52 data-[motion=from-start]:lma-slide-in-from-left-52 data-[motion=to-end]:lma-slide-out-to-right-52 data-[motion=to-start]:lma-slide-out-to-left-52 md:lma-absolute md:lma-w-auto",
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("lma-absolute lma-left-0 lma-top-full lma-flex lma-justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "lma-origin-top-center lma-relative lma-mt-1.5 lma-h-[var(--radix-navigation-menu-viewport-height)] lma-w-full lma-overflow-hidden lma-rounded-md lma-border lma-bg-popover lma-text-popover-foreground lma-shadow-lg data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-90 md:lma-w-[var(--radix-navigation-menu-viewport-width)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "lma-top-full lma-z-[1] lma-flex lma-h-1.5 lma-items-end lma-justify-center lma-overflow-hidden data-[state=visible]:lma-animate-in data-[state=hidden]:lma-animate-out data-[state=hidden]:lma-fade-out data-[state=visible]:lma-fade-in",
      className,
    )}
    {...props}
  >
    <div className="lma-relative lma-top-[60%] lma-h-2 lma-w-2 lma-rotate-45 lma-rounded-tl-sm lma-bg-border lma-shadow-md" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
