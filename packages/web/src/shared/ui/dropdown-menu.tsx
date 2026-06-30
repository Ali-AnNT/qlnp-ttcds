import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-px-2 lma-py-1.5 lma-text-sm outline-none data-[state=open]:lma-bg-accent focus:lma-bg-accent",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="lma-ml-auto lma-h-4 lma-w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "lma-z-50 lma-min-w-[8rem] lma-overflow-hidden lma-rounded-md lma-border lma-bg-popover !lma-p-1 lma-text-popover-foreground lma-shadow-lg data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[side=bottom]:lma-slide-in-from-top-2 data-[side=left]:lma-slide-in-from-right-2 data-[side=right]:lma-slide-in-from-left-2 data-[side=top]:lma-slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "lma-z-50 lma-min-w-[8rem] lma-overflow-hidden lma-rounded-md lma-border lma-bg-popover !lma-p-1 lma-text-popover-foreground lma-shadow-md data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[side=bottom]:lma-slide-in-from-top-2 data-[side=left]:lma-slide-in-from-right-2 data-[side=right]:lma-slide-in-from-left-2 data-[side=top]:lma-slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-px-2 lma-py-1.5 lma-text-sm outline-none lma-transition-colors data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-py-1.5 lma-pl-8 lma-pr-2 lma-text-sm outline-none lma-transition-colors data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="lma-absolute lma-left-2 lma-flex lma-h-3.5 lma-w-3.5 lma-items-center lma-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="lma-h-4 lma-w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-py-1.5 lma-pl-8 lma-pr-2 lma-text-sm outline-none lma-transition-colors data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      className,
    )}
    {...props}
  >
    <span className="lma-absolute lma-left-2 lma-flex lma-h-3.5 lma-w-3.5 lma-items-center lma-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="lma-h-2 lma-w-2 lma-fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "lma-px-2 lma-py-1.5 lma-text-sm lma-font-semibold",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-lma-mx-1 lma-my-1 lma-h-px lma-bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("lma-ml-auto lma-text-xs lma-tracking-widest lma-opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
