import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-px-2 lma-py-1.5 lma-text-sm outline-none data-[state=open]:lma-bg-accent data-[state=open]:lma-text-accent-foreground focus:lma-bg-accent focus:lma-text-accent-foreground",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="lma-ml-auto lma-h-4 lma-w-4" />
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "lma-z-50 lma-min-w-[8rem] lma-overflow-hidden lma-rounded-md lma-border lma-bg-popover !lma-p-1 lma-text-popover-foreground lma-shadow-md data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[side=bottom]:lma-slide-in-from-top-2 data-[side=left]:lma-slide-in-from-right-2 data-[side=right]:lma-slide-in-from-left-2 data-[side=top]:lma-slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "lma-z-50 lma-min-w-[8rem] lma-overflow-hidden lma-rounded-md lma-border lma-bg-popover !lma-p-1 lma-text-popover-foreground lma-shadow-md lma-animate-in lma-fade-in-80 data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[side=bottom]:lma-slide-in-from-top-2 data-[side=left]:lma-slide-in-from-right-2 data-[side=right]:lma-slide-in-from-left-2 data-[side=top]:lma-slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-px-2 lma-py-1.5 lma-text-sm outline-none data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-py-1.5 lma-pl-8 lma-pr-2 lma-text-sm outline-none data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="lma-absolute lma-left-2 lma-flex lma-h-3.5 lma-w-3.5 lma-items-center lma-justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="lma-h-4 lma-w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-py-1.5 lma-pl-8 lma-pr-2 lma-text-sm outline-none data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      className,
    )}
    {...props}
  >
    <span className="lma-absolute lma-left-2 lma-flex lma-h-3.5 lma-w-3.5 lma-items-center lma-justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="lma-h-2 lma-w-2 lma-fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "lma-px-2 lma-py-1.5 lma-text-sm lma-font-semibold lma-text-foreground",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-lma-mx-1 lma-my-1 lma-h-px lma-bg-border", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "lma-ml-auto lma-text-xs lma-tracking-widest lma-text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
