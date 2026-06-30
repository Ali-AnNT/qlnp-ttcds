import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const MenubarMenu = MenubarPrimitive.Menu;

const MenubarGroup = MenubarPrimitive.Group;

const MenubarPortal = MenubarPrimitive.Portal;

const MenubarSub = MenubarPrimitive.Sub;

const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "lma-flex lma-h-10 lma-items-center lma-space-x-1 lma-rounded-md lma-border lma-bg-background !lma-p-1",
      className,
    )}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-px-3 lma-py-1.5 lma-text-sm lma-font-medium outline-none data-[state=open]:lma-bg-accent data-[state=open]:lma-text-accent-foreground focus:lma-bg-accent focus:lma-text-accent-foreground",
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
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
  </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "lma-z-50 lma-min-w-[8rem] lma-overflow-hidden lma-rounded-md lma-border lma-bg-popover !lma-p-1 lma-text-popover-foreground data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[side=bottom]:lma-slide-in-from-top-2 data-[side=left]:lma-slide-in-from-right-2 data-[side=right]:lma-slide-in-from-left-2 data-[side=top]:lma-slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref,
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "lma-z-50 lma-min-w-[12rem] lma-overflow-hidden lma-rounded-md lma-border lma-bg-popover !lma-p-1 lma-text-popover-foreground lma-shadow-md data-[state=open]:lma-animate-in data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[side=bottom]:lma-slide-in-from-top-2 data-[side=left]:lma-slide-in-from-right-2 data-[side=right]:lma-slide-in-from-left-2 data-[side=top]:lma-slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  ),
);
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-px-2 lma-py-1.5 lma-text-sm outline-none data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-py-1.5 lma-pl-8 lma-pr-2 lma-text-sm outline-none data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="lma-absolute lma-left-2 lma-flex lma-h-3.5 lma-w-3.5 lma-items-center lma-justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="lma-h-4 lma-w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-py-1.5 lma-pl-8 lma-pr-2 lma-text-sm outline-none data-[disabled]:lma-pointer-events-none data-[disabled]:lma-opacity-50 focus:lma-bg-accent focus:lma-text-accent-foreground",
      className,
    )}
    {...props}
  >
    <span className="lma-absolute lma-left-2 lma-flex lma-h-3.5 lma-w-3.5 lma-items-center lma-justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="lma-h-2 lma-w-2 lma-fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "lma-px-2 lma-py-1.5 lma-text-sm lma-font-semibold",
      inset && "lma-pl-8",
      className,
    )}
    {...props}
  />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-lma-mx-1 lma-my-1 lma-h-px lma-bg-muted", className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarShortcut = ({
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
MenubarShortcut.displayname = "MenubarShortcut";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
