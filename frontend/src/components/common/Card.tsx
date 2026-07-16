import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-lg transition-all duration-200 hover:border-border/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
