import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getWorkspaces, getScans } from '@/api/client';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/Loading';
import { StatusBadge } from '@/components/common/Badge';
import { Boxes, Search, Clock, Activity, ArrowRight, Play, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const scansQuery = useQuery({
    queryKey: ['scans'],
    queryFn: () => getScans(20),
  });

  const isLoading = workspacesQuery.isLoading || scansQuery.isLoading;
  const isError = workspacesQuery.isError || scansQuery.isError;

  if (isLoading) {
    return <LoadingSpinner message="Aggregating metrics..." fullPage />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-error space-y-4">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-mono">Failed to fetch server dashboard metrics.</p>
      </div>
    );
  }

  const workspaces = workspacesQuery.data || [];
  const scans = scansQuery.data || [];

  const totalWorkspaces = workspaces.length;
  const totalScans = scans.length;
  const lastScan = scans[0];

  const stats = [
    {
      label: 'Workspaces',
      value: totalWorkspaces,
      icon: Boxes,
      color: 'text-terraform',
      bg: 'bg-terraform/5',
    },
    {
      label: 'Total Scans',
      value: totalScans,
      icon: Search,
      color: 'text-go',
      bg: 'bg-go/5',
    },
    {
      label: 'Last Scan Run',
      value: lastScan
        ? new Date(lastScan.started_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Never',
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-muted-foreground/5',
    },
    {
      label: 'System Status',
      value: lastScan ? lastScan.status.toUpperCase() : 'IDLE',
      icon: Activity,
      color: lastScan?.status === 'completed' ? 'text-success' : lastScan?.status === 'failed' ? 'text-error' : 'text-go',
      bg: 'bg-background/50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Infrastructure Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor Terraform drift states and scan executions across all workspaces.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold tracking-tight text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Panel: Recent Scans */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Recent Scans</h3>
            <p className="text-xs text-muted-foreground">The most recent scan executions across all cloud accounts.</p>
          </div>
          <button
            onClick={() => navigate('/workspaces')}
            className="flex items-center space-x-2 text-xs font-medium text-terraform hover:text-terraform/80 transition-colors"
          >
            <span>Trigger new scan</span>
            <Play className="h-3 w-3 fill-current" />
          </button>
        </div>

        {scans.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium">No scans recorded yet</p>
            <p className="text-xs text-muted-foreground/80">Configure a workspace and run a scan to detect drift.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-2xs font-mono uppercase text-muted-foreground">
                  <th className="py-4 px-6">Scan ID</th>
                  <th className="py-4 px-6">Workspace</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Findings</th>
                  <th className="py-4 px-6">Executed At</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {scans.slice(0, 8).map((scan) => (
                  <tr key={scan.scan_id} className="hover:bg-border/20 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {scan.scan_id}
                    </td>
                    <td className="py-4 px-6 font-semibold text-foreground">{scan.workspace || 'Adhoc'}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={scan.status} />
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {scan.status === 'completed' ? (
                        <span className={scan.summary.total_findings > 0 ? 'text-aws' : 'text-success'}>
                          {scan.summary.total_findings} drifts
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground">
                      {new Date(scan.started_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/scans/${scan.scan_id}`)}
                        className="p-1 px-3 rounded bg-border/50 border border-border text-xs text-foreground hover:bg-border hover:text-foreground transition-colors inline-flex items-center space-x-1.5"
                      >
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
