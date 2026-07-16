import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message = 'Loading...', fullPage = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 p-12">
      <Loader2 className="h-8 w-8 text-go animate-spin" />
      <p className="text-sm text-muted-foreground font-mono">{message}</p>
    </div>
  );

  if (fullPage) {
    return <div className="h-96 w-full flex items-center justify-center">{content}</div>;
  }
  return content;
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-border rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-3 bg-border rounded w-3/4" />
        <div className="h-3 bg-border rounded w-5/6" />
      </div>
      <div className="h-8 bg-border rounded-lg w-full mt-4" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden animate-pulse">
      <div className="h-12 bg-border/20 border-b border-border" />
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-border/30 rounded flex-1" />
            <div className="h-4 bg-border/30 rounded w-24" />
            <div className="h-4 bg-border/30 rounded w-20" />
            <div className="h-4 bg-border/30 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
