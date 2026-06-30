import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/shared/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn("lma-flex lma-h-full lma-w-full data-[panel-group-direction=vertical]:lma-flex-col", className)}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "lma-relative lma-flex lma-w-px lma-items-center lma-justify-center lma-bg-border after:lma-absolute after:lma-inset-y-0 after:lma-left-1/2 after:lma-w-1 after:lma--translate-x-1/2 data-[panel-group-direction=vertical]:lma-h-px data-[panel-group-direction=vertical]:lma-w-full data-[panel-group-direction=vertical]:after:lma-left-0 data-[panel-group-direction=vertical]:after:lma-h-1 data-[panel-group-direction=vertical]:after:lma-w-full data-[panel-group-direction=vertical]:after:lma--translate-y-1/2 data-[panel-group-direction=vertical]:after:lma-translate-x-0 focus-visible:lma-outline-none focus-visible:lma-ring-1 focus-visible:lma-ring-ring focus-visible:lma-ring-offset-1 [&[data-panel-group-direction=vertical]>div]:lma-rotate-90",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="lma-z-10 lma-flex lma-h-4 lma-w-3 lma-items-center lma-justify-center lma-rounded-sm lma-border lma-bg-border">
        <GripVertical className="lma-h-2.5 lma-w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
