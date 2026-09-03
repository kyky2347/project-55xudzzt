import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "instrument-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-mono text-[11px] font-medium uppercase tracking-[0.16em] transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-35 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "border border-primary/65 bg-primary/10 text-primary hover:bg-primary/18 hover:border-primary",
        secondary: "border border-border bg-secondary/80 text-secondary-foreground hover:bg-secondary",
        ghost: "border border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
        danger: "border border-destructive/65 bg-destructive/10 text-destructive hover:bg-destructive/18",
      },
      size: { default: "h-11 px-5", sm: "h-9 px-3", lg: "h-13 px-7 text-xs", icon: "size-10 px-0" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";

export { buttonVariants };
