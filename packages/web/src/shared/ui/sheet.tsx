import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "lma-fixed lma-inset-0 lma-z-50 lma-bg-black/80 data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "lma-fixed lma-z-50 lma-gap-4 lma-bg-background !lma-p-6 lma-shadow-lg lma-transition lma-ease-in-out data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-duration-300 data-[state=open]:lma-duration-500",
  {
    variants: {
      side: {
        top: "lma-inset-x-0 lma-top-0 lma-border-b data-[state=closed]:lma-slide-out-to-top data-[state=open]:lma-slide-in-from-top",
        bottom:
          "lma-inset-x-0 lma-bottom-0 lma-border-t data-[state=closed]:lma-slide-out-to-bottom data-[state=open]:lma-slide-in-from-bottom",
        left: "lma-inset-y-0 lma-left-0 lma-h-full lma-w-3/4 lma-border-r data-[state=closed]:lma-slide-out-to-left data-[state=open]:lma-slide-in-from-left sm:lma-max-w-sm",
        right:
          "lma-inset-y-0 lma-right-0 lma-h-full lma-w-3/4  lma-border-l data-[state=closed]:lma-slide-out-to-right data-[state=open]:lma-slide-in-from-right sm:lma-max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="lma-absolute lma-right-4 lma-top-4 lma-rounded-sm lma-opacity-70 lma-ring-offset-background lma-transition-opacity data-[state=open]:lma-bg-secondary hover:lma-opacity-100 focus:outline-none focus:lma-ring-2 focus:lma-ring-ring focus:lma-ring-offset-2 disabled:lma-pointer-events-none">
        <X className="lma-h-4 lma-w-4" />
        <span className="lma-sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "lma-flex lma-flex-col lma-space-y-2 lma-text-center sm:lma-text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "lma-flex lma-flex-col-reverse sm:lma-flex-row sm:lma-justify-end sm:lma-space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("lma-text-lg lma-font-semibold lma-text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("lma-text-sm lma-text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
