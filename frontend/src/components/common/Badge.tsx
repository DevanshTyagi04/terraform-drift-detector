import { cn } from '@/lib/utils';
import type { Severity, DriftKind } from '@/api/types';

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        className
      )}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  switch (severity) {
    case 'critical':
      return (
        <Badge className="bg-error/10 text-error border-error/20">
          Critical
        </Badge>
      );
    case 'warning':
      return (
        <Badge className="bg-aws/10 text-aws border-aws/20">
          Warning
        </Badge>
      );
    case 'info':
    default:
      return (
        <Badge className="bg-go/10 text-go border-go/20">
          Info
        </Badge>
      );
  }
}

export function StatusBadge({ status }: { status: 'running' | 'completed' | 'failed' }) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-error/10 text-error border-error/20">
          Failed
        </Badge>
      );
    case 'running':
    default:
      return (
        <Badge className="bg-go/10 text-go border-go/20 animate-pulse">
          Running
        </Badge>
      );
  }
}

export function ProviderBadge({ provider }: { provider: string }) {
  const isAWS = provider.toLowerCase() === 'aws';
  return (
    <Badge
      className={cn(
        isAWS
          ? 'bg-aws/10 text-aws border-aws/20 font-mono uppercase'
          : 'bg-terraform/10 text-terraform border-terraform/20 font-mono uppercase'
      )}
    >
      {provider}
    </Badge>
  );
}

export function DriftKindBadge({ kind }: { kind: DriftKind }) {
  switch (kind) {
    case 'missing_in_cloud':
      return (
        <Badge className="bg-error/10 text-error border-error/20">
          Missing
        </Badge>
      );
    case 'extra_in_cloud':
      return (
        <Badge className="bg-aws/10 text-aws border-aws/20">
          Extra
        </Badge>
      );
    case 'attribute_changed':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          Modified
        </Badge>
      );
    case 'tags_changed':
      return (
        <Badge className="bg-terraform/10 text-terraform border-terraform/20">
          Tags
        </Badge>
      );
    default:
      return <Badge className="bg-muted-foreground/10 text-muted-foreground border-border">{kind}</Badge>;
  }
}
