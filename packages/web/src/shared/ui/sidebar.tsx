import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";
import { Sheet, SheetContent } from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open],
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      ],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper lma-flex lma-min-h-svh lma-w-full has-[[data-variant=inset]]:lma-bg-sidebar",
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "lma-flex lma-h-full lma-w-[--sidebar-width] lma-flex-col lma-bg-sidebar lma-text-sidebar-foreground",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="lma-w-[--sidebar-width] lma-bg-sidebar !lma-p-0 lma-text-sidebar-foreground [&>button]:lma-hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="lma-flex lma-h-full lma-w-full lma-flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer lma-hidden lma-text-sidebar-foreground md:lma-block"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "lma-relative lma-h-svh lma-w-[--sidebar-width] lma-bg-transparent lma-transition-[width] lma-duration-200 lma-ease-linear",
            "group-data-[collapsible=offcanvas]:lma-w-0",
            "group-data-[side=right]:lma-rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:lma-w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:lma-w-[--sidebar-width-icon]",
          )}
        />
        <div
          className={cn(
            "lma-fixed lma-inset-y-0 lma-z-10 lma-hidden lma-h-svh lma-w-[--sidebar-width] lma-transition-[left,right,width] lma-duration-200 lma-ease-linear md:lma-flex",
            side === "left"
              ? "lma-left-0 group-data-[collapsible=offcanvas]:lma-left-[calc(var(--sidebar-width)*-1)]"
              : "lma-right-0 group-data-[collapsible=offcanvas]:lma-right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "lma-p-2 group-data-[collapsible=icon]:lma-w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:lma-w-[--sidebar-width-icon] group-data-[side=left]:lma-border-r group-data-[side=right]:lma-border-l",
            className,
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="lma-flex lma-h-full lma-w-full lma-flex-col lma-bg-sidebar group-data-[variant=floating]:lma-rounded-lg group-data-[variant=floating]:lma-border group-data-[variant=floating]:lma-border-sidebar-border group-data-[variant=floating]:lma-shadow"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("lma-h-7 lma-w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="lma-sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "lma-absolute lma-inset-y-0 lma-z-20 lma-hidden lma-w-4 -lma-translate-x-1/2 lma-transition-all lma-ease-linear after:lma-absolute after:lma-inset-y-0 after:lma-left-1/2 after:lma-w-[2px] group-data-[side=left]:-lma-right-4 group-data-[side=right]:lma-left-0 hover:after:lma-bg-sidebar-border sm:lma-flex",
        "[[data-side=left]_&]:lma-cursor-w-resize [[data-side=right]_&]:lma-cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:lma-cursor-e-resize [[data-side=right][data-state=collapsed]_&]:lma-cursor-w-resize",
        "group-data-[collapsible=offcanvas]:lma-translate-x-0 group-data-[collapsible=offcanvas]:after:lma-left-full group-data-[collapsible=offcanvas]:hover:lma-bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-lma-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-lma-left-2",
        className,
      )}
      {...props}
    />
  );
});
SidebarRail.displayName = "SidebarRail";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "lma-relative lma-flex lma-min-h-svh lma-flex-1 lma-flex-col lma-bg-background",
        "peer-data-[variant=inset]:lma-min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:lma-m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:lma-ml-2 md:peer-data-[variant=inset]:lma-ml-0 md:peer-data-[variant=inset]:lma-rounded-xl md:peer-data-[variant=inset]:lma-shadow",
        className,
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "lma-h-8 lma-w-full lma-bg-background lma-shadow-none focus-visible:lma-ring-2 focus-visible:lma-ring-sidebar-ring",
        className,
      )}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("lma-flex lma-flex-col lma-gap-2 !lma-p-2", className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("lma-flex lma-flex-col lma-gap-2 !lma-p-2", className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("lma-mx-2 lma-w-auto lma-bg-sidebar-border", className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "lma-flex lma-min-h-0 lma-flex-1 lma-flex-col lma-gap-2 lma-overflow-auto group-data-[collapsible=icon]:lma-overflow-hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("lma-relative lma-flex lma-w-full lma-min-w-0 lma-flex-col !lma-p-2", className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "lma-flex lma-h-8 shrink-0 lma-items-center lma-rounded-md lma-px-2 lma-text-xs lma-font-medium lma-text-sidebar-foreground/70 outline-none lma-ring-sidebar-ring lma-transition-[margin,opa] lma-duration-200 lma-ease-linear focus-visible:lma-ring-2 [&>svg]:lma-size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-lma-mt-8 group-data-[collapsible=icon]:lma-opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, type = "button", ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type={type}
      data-sidebar="group-action"
      className={cn(
        "lma-absolute lma-right-3 lma-top-3.5 lma-flex aspect-square lma-w-5 lma-items-center lma-justify-center lma-rounded-md !lma-p-0 lma-text-sidebar-foreground outline-none lma-ring-sidebar-ring lma-transition-transform hover:lma-bg-sidebar-accent hover:lma-text-sidebar-accent-foreground focus-visible:lma-ring-2 [&>svg]:lma-size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:lma-absolute after:-lma-inset-2 after:md:lma-hidden",
        "group-data-[collapsible=icon]:lma-hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("lma-w-full lma-text-sm", className)}
    {...props}
  />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("lma-flex lma-w-full lma-min-w-0 lma-flex-col lma-gap-1", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item lma-relative", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button lma-flex lma-w-full lma-items-center lma-gap-2 lma-overflow-hidden lma-rounded-md !lma-p-2 lma-text-left lma-text-sm outline-none lma-ring-sidebar-ring lma-transition-[width,height,padding] hover:lma-bg-sidebar-accent hover:lma-text-sidebar-accent-foreground focus-visible:lma-ring-2 active:lma-bg-sidebar-accent active:lma-text-sidebar-accent-foreground disabled:lma-pointer-events-none disabled:lma-opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:lma-pr-8 aria-disabled:lma-pointer-events-none aria-disabled:lma-opacity-50 data-[active=true]:lma-bg-sidebar-accent data-[active=true]:lma-font-medium data-[active=true]:lma-text-sidebar-accent-foreground data-[state=open]:hover:lma-bg-sidebar-accent data-[state=open]:hover:lma-text-sidebar-accent-foreground group-data-[collapsible=icon]:!lma-size-8 group-data-[collapsible=icon]:!lma-p-2 [&>span:last-child]:truncate [&>svg]:lma-size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:lma-bg-sidebar-accent hover:lma-text-sidebar-accent-foreground",
        outline:
          "lma-bg-background lma-shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:lma-bg-sidebar-accent hover:lma-text-sidebar-accent-foreground hover:lma-shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "lma-h-8 lma-text-sm",
        sm: "lma-h-7 lma-text-xs",
        lg: "lma-h-12 lma-text-sm group-data-[collapsible=icon]:!lma-p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        type={type}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(
  (
    {
      className,
      asChild = false,
      showOnHover = false,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={type}
        data-sidebar="menu-action"
        className={cn(
          "lma-absolute lma-right-1 lma-top-1.5 lma-flex aspect-square lma-w-5 lma-items-center lma-justify-center lma-rounded-md !lma-p-0 lma-text-sidebar-foreground outline-none lma-ring-sidebar-ring lma-transition-transform peer-hover/menu-button:lma-text-sidebar-accent-foreground hover:lma-bg-sidebar-accent hover:lma-text-sidebar-accent-foreground focus-visible:lma-ring-2 [&>svg]:lma-size-4 [&>svg]:shrink-0",
          // Increases the hit area of the button on mobile.
          "after:lma-absolute after:-lma-inset-2 after:md:lma-hidden",
          "peer-data-[size=sm]/menu-button:lma-top-1",
          "peer-data-[size=default]/menu-button:lma-top-1.5",
          "peer-data-[size=lg]/menu-button:lma-top-2.5",
          "group-data-[collapsible=icon]:lma-hidden",
          showOnHover &&
            "group-focus-within/menu-item:lma-opacity-100 group-hover/menu-item:lma-opacity-100 data-[state=open]:lma-opacity-100 peer-data-[active=true]/menu-button:lma-text-sidebar-accent-foreground md:lma-opacity-0",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "lma-pointer-events-none lma-absolute lma-right-1 lma-flex lma-h-5 lma-min-w-5 lma-select-none lma-items-center lma-justify-center lma-rounded-md lma-px-1 lma-text-xs lma-font-medium tabular-nums lma-text-sidebar-foreground",
      "peer-hover/menu-button:lma-text-sidebar-accent-foreground peer-data-[active=true]/menu-button:lma-text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:lma-top-1",
      "peer-data-[size=default]/menu-button:lma-top-1.5",
      "peer-data-[size=lg]/menu-button:lma-top-2.5",
      "group-data-[collapsible=icon]:lma-hidden",
      className,
    )}
    {...props}
  />
));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("lma-flex lma-h-8 lma-items-center lma-gap-2 lma-rounded-md lma-px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="lma-size-4 lma-rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="lma-h-4 lma-max-w-[--skeleton-width] lma-flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "lma-mx-3.5 lma-flex lma-min-w-0 lma-translate-x-px lma-flex-col lma-gap-1 lma-border-l lma-border-sidebar-border lma-px-2.5 lma-py-0.5",
      "group-data-[collapsible=icon]:lma-hidden",
      className,
    )}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "lma-flex lma-h-7 lma-min-w-0 -lma-translate-x-px lma-items-center lma-gap-2 lma-overflow-hidden lma-rounded-md lma-px-2 lma-text-sidebar-foreground outline-none lma-ring-sidebar-ring aria-disabled:lma-pointer-events-none aria-disabled:lma-opacity-50 hover:lma-bg-sidebar-accent hover:lma-text-sidebar-accent-foreground focus-visible:lma-ring-2 active:lma-bg-sidebar-accent active:lma-text-sidebar-accent-foreground disabled:lma-pointer-events-none disabled:lma-opacity-50 [&>span:last-child]:truncate [&>svg]:lma-size-4 [&>svg]:shrink-0 [&>svg]:lma-text-sidebar-accent-foreground",
        "data-[active=true]:lma-bg-sidebar-accent data-[active=true]:lma-text-sidebar-accent-foreground",
        size === "sm" && "lma-text-xs",
        size === "md" && "lma-text-sm",
        "group-data-[collapsible=icon]:lma-hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
