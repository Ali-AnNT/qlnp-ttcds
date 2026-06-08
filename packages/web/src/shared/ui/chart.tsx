import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/shared/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> });
};

type ChartContextProps = {
  config: ChartConfig;
};

type ChartPayload = {
  color?: string;
  dataKey?: string | number;
  fill?: string;
  name?: string | number;
  payload?: Record<string, unknown>;
  value?: unknown;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "lma-flex aspect-video lma-justify-center lma-text-xs [&_.recharts-cartesian-axis-tick_text]:lma-fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:lma-stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:lma-stroke-border [&_.recharts-dot[stroke='#fff']]:lma-stroke-transparent [&_.recharts-layer]:lma-outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:lma-stroke-border [&_.recharts-radial-bar-background-sector]:lma-fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:lma-fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:lma-stroke-border [&_.recharts-sector[stroke='#fff']]:lma-stroke-transparent [&_.recharts-sector]:lma-outline-none [&_.recharts-surface]:lma-outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([_, config]) => config.theme || config.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
      active?: boolean;
      payload?: ChartPayload[];
      label?: React.ReactNode;
      labelFormatter?: (value: React.ReactNode, payload: ChartPayload[]) => React.ReactNode;
      formatter?: (
        value: unknown,
        name: string,
        item: ChartPayload,
        index: number,
        payload?: Record<string, unknown>
      ) => React.ReactNode;
      color?: string;
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return <div className={cn("lma-font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>;
      }

      if (!value) {
        return null;
      }

      return <div className={cn("lma-font-medium", labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "lma-grid lma-min-w-[8rem] lma-items-start lma-gap-1.5 lma-rounded-lg lma-border lma-border-border/50 lma-bg-background lma-px-2.5 lma-py-1.5 lma-text-xs lma-shadow-xl",
          className,
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="lma-grid lma-gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload?.fill || item.fill || item.color;

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "lma-flex lma-w-full lma-flex-wrap lma-items-stretch lma-gap-2 [&>svg]:lma-h-2.5 [&>svg]:lma-w-2.5 [&>svg]:lma-text-muted-foreground",
                  indicator === "dot" && "lma-items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, String(item.name), item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn("lma-shrink-0 lma-rounded-[2px] lma-border-[--color-border] lma-bg-[--color-bg]", {
                            "lma-h-2.5 lma-w-2.5": indicator === "dot",
                            "lma-w-1": indicator === "line",
                            "lma-w-0 lma-border-[1.5px] lma-border-dashed lma-bg-transparent": indicator === "dashed",
                            "lma-my-0.5": nestLabel && indicator === "dashed",
                          })}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "lma-flex lma-flex-1 lma-justify-between lma-leading-none",
                        nestLabel ? "lma-items-end" : "lma-items-center",
                      )}
                    >
                      <div className="lma-grid lma-gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="lma-text-muted-foreground">{itemConfig?.label || item.name}</span>
                      </div>
                      {item.value && (
                        <span className="lma-font-mono lma-font-medium tabular-nums lma-text-foreground">
                          {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    {
      payload?: ChartPayload[];
      verticalAlign?: "top" | "bottom";
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("lma-flex lma-items-center lma-justify-center lma-gap-4", verticalAlign === "top" ? "lma-pb-3" : "lma-pt-3", className)}
    >
      {payload.map((item, index) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div
            key={`${item.value || item.dataKey || index}`}
            className={cn("lma-flex lma-items-center lma-gap-1.5 [&>svg]:lma-h-3 [&>svg]:lma-w-3 [&>svg]:lma-text-muted-foreground")}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="lma-h-2 lma-w-2 lma-shrink-0 lma-rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
