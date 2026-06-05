import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "lma-flex lma-h-full lma-w-full lma-flex-col lma-overflow-hidden lma-rounded-md lma-bg-popover lma-text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

type CommandDialogProps = DialogProps;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="lma-overflow-hidden !lma-p-0 lma-shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:lma-px-2 [&_[cmdk-group-heading]]:lma-font-medium [&_[cmdk-group-heading]]:lma-text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:lma-pt-0 [&_[cmdk-group]]:lma-px-2 [&_[cmdk-input-wrapper]_svg]:lma-h-5 [&_[cmdk-input-wrapper]_svg]:lma-w-5 [&_[cmdk-input]]:lma-h-12 [&_[cmdk-item]]:lma-px-2 [&_[cmdk-item]]:lma-py-3 [&_[cmdk-item]_svg]:lma-h-5 [&_[cmdk-item]_svg]:lma-w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="lma-flex lma-items-center lma-border-b lma-px-3" cmdk-input-wrapper="">
    <Search className="lma-mr-2 lma-h-4 lma-w-4 shrink-0 lma-opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "lma-flex lma-h-11 lma-w-full lma-rounded-md lma-bg-transparent lma-py-3 lma-text-sm outline-none placeholder:lma-text-muted-foreground disabled:lma-cursor-not-allowed disabled:lma-opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("lma-max-h-[300px] lma-overflow-y-auto lma-overflow-x-hidden", className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="lma-py-6 lma-text-center lma-text-sm"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "lma-overflow-hidden !lma-p-1 lma-text-foreground [&_[cmdk-group-heading]]:lma-px-2 [&_[cmdk-group-heading]]:lma-py-1.5 [&_[cmdk-group-heading]]:lma-text-xs [&_[cmdk-group-heading]]:lma-font-medium [&_[cmdk-group-heading]]:lma-text-muted-foreground",
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-lma-mx-1 lma-h-px lma-bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "lma-relative lma-flex lma-cursor-default lma-select-none lma-items-center lma-rounded-sm lma-px-2 lma-py-1.5 lma-text-sm outline-none data-[disabled=true]:lma-pointer-events-none data-[selected='true']:lma-bg-accent data-[selected=true]:lma-text-accent-foreground data-[disabled=true]:lma-opacity-50",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
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
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
