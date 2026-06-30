import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "lma-fixed lma-top-0 lma-z-[100] lma-flex lma-max-h-screen lma-w-full lma-flex-col-reverse !lma-p-4 sm:lma-bottom-0 sm:lma-right-0 sm:lma-top-auto sm:lma-flex-col md:lma-max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group lma-pointer-events-auto lma-relative lma-flex lma-w-full lma-items-center lma-justify-between lma-space-x-4 lma-overflow-hidden lma-rounded-md lma-border !lma-p-6 lma-pr-8 lma-shadow-lg lma-transition-all data-[swipe=cancel]:lma-translate-x-0 data-[swipe=end]:lma-translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:lma-translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:lma-transition-none data-[state=open]:lma-animate-in data-[state=closed]:lma-animate-out data-[swipe=end]:lma-animate-out data-[state=closed]:lma-fade-out-80 data-[state=closed]:lma-slide-out-to-right-full data-[state=open]:lma-slide-in-from-top-full data-[state=open]:sm:lma-slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "lma-border lma-bg-background lma-text-foreground",
        destructive:
          "destructive group lma-border-destructive lma-bg-destructive lma-text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "lma-inline-flex lma-h-8 shrink-0 lma-items-center lma-justify-center lma-rounded-md lma-border lma-bg-transparent lma-px-3 lma-text-sm lma-font-medium lma-ring-offset-background lma-transition-colors group-[.destructive]:lma-border-muted/40 hover:lma-bg-secondary group-[.destructive]:hover:lma-border-destructive/30 group-[.destructive]:hover:lma-bg-destructive group-[.destructive]:hover:lma-text-destructive-foreground focus:outline-none focus:lma-ring-2 focus:lma-ring-ring focus:lma-ring-offset-2 group-[.destructive]:focus:lma-ring-destructive disabled:lma-pointer-events-none disabled:lma-opacity-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "lma-absolute lma-right-2 lma-top-2 lma-rounded-md !lma-p-1 lma-text-foreground/50 lma-opacity-0 lma-transition-opacity group-hover:lma-opacity-100 group-[.destructive]:lma-text-red-300 hover:lma-text-foreground group-[.destructive]:hover:lma-text-red-50 focus:lma-opacity-100 focus:outline-none focus:lma-ring-2 group-[.destructive]:focus:lma-ring-red-400 group-[.destructive]:focus:lma-ring-offset-red-600",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="lma-h-4 lma-w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("lma-text-sm lma-font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("lma-text-sm lma-opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
