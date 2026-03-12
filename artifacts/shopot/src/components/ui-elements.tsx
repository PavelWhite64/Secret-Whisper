import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    variant?: "default" | "outline" | "ghost" | "destructive" | "market",
    size?: "sm" | "default" | "lg" | "icon",
    isLoading?: boolean
  }
>(({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-white/10 hover:text-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
    market: "bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 shadow-lg shadow-accent/20",
  };
  
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg",
    default: "h-10 px-4 py-2 rounded-xl",
    lg: "h-12 px-8 rounded-2xl text-lg",
    icon: "h-9 w-9 rounded-full justify-center",
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
