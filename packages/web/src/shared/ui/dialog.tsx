import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "lma-fixed lma-inset-0 lma-z-50 lma-bg-black/80 data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "lma-fixed lma-left-[50%] lma-top-[50%] lma-z-50 lma-grid lma-w-full lma-max-w-lg lma-translate-x-[-50%] lma-translate-y-[-50%] lma-gap-4 lma-border lma-bg-background !lma-p-6 lma-shadow-lg lma-duration-200 data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[state=closed]:lma-fade-out-0 data-[state=open]:lma-fade-in-0 data-[state=closed]:lma-zoom-out-95 data-[state=open]:lma-zoom-in-95 data-[state=closed]:lma-slide-out-to-left-1/2 data-[state=closed]:lma-slide-out-to-top-[48%] data-[state=open]:lma-slide-in-from-left-1/2 data-[state=open]:lma-slide-in-from-top-[48%] sm:lma-rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="lma-absolute lma-right-4 lma-top-4 lma-rounded-sm lma-opacity-70 lma-ring-offset-background lma-transition-opacity data-[state=open]:lma-bg-accent data-[state=open]:lma-text-muted-foreground hover:lma-opacity-100 focus:outline-none focus:lma-ring-2 focus:lma-ring-ring focus:lma-ring-offset-2 disabled:lma-pointer-events-none">
        <X className="lma-h-4 lma-w-4" />
        <span className="lma-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "lma-flex lma-flex-col lma-space-y-1.5 lma-text-center sm:lma-text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "lma-text-lg lma-font-semibold lma-leading-none lma-tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("lma-text-sm lma-text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
