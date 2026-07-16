import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getScans } from '@/api/client';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/Loading';
import { StatusBadge } from '@/components/common/Badge';
import { Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function History() {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(50);

  const scansQuery = useQuery({
    queryKey: ['allScans', limit],
    queryFn: () => getScans(limit),
  });

  const isLoading = scansQuery.isLoading;
  const isError = scansQuery.isError;

  if (isLoading) {
    return <LoadingSpinner message="Querying execution logs..." fullPage />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-error space-y-4">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-mono">Failed to query scan history.</p>
      </div>
    );
  }

  const scans = scansQuery.data || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Scan History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Historical audit log of all drift detection scans triggered in this engine.
          </p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-terraform font-mono cursor-pointer"
        >
          <option value={20}>Limit: 20</option>
          <option value={50}>Limit: 50</option>
          <option value={100}>Limit: 100</option>
        </select>
      </div>

      {/* Main scans history card */}
      <Card className="overflow-hidden">
        {scans.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-2">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-semibold">No scan history recorded</p>
            <p className="text-xs text-muted-foreground/80">
              Run manual scan on any workspace or configure schedule cron jobs to populate this view.
            </p>
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
                {scans.map((scan) => (
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
                        className="p-1 px-3 rounded bg-border/50 border border-border text-xs text-foreground hover:bg-border hover:text-foreground transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
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
