import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:lma-bg-background group-[.toaster]:lma-text-foreground group-[.toaster]:lma-border-border group-[.toaster]:lma-shadow-lg",
          description: "group-[.toast]:lma-text-muted-foreground",
          actionButton: "group-[.toast]:lma-bg-primary group-[.toast]:lma-text-primary-foreground",
          cancelButton: "group-[.toast]:lma-bg-muted group-[.toast]:lma-text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
