import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getWorkspaces, getScans, deleteWorkspace, triggerScan } from '@/api/client';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/Loading';
import { ProviderBadge, StatusBadge } from '@/components/common/Badge';
import { Plus, Play, Trash2, ArrowRight, Server, Cloud, RefreshCw, AlertCircle, Boxes } from 'lucide-react';
import { useState } from 'react';

export default function Workspaces() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const scansQuery = useQuery({
    queryKey: ['scans'],
    queryFn: () => getScans(100),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: triggerScan,
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      // Navigate to scan details page
      navigate(`/scans/${report.scan_id}`);
    },
    onSettled: () => {
      setTriggeringId(null);
    },
  });

  const isLoading = workspacesQuery.isLoading || scansQuery.isLoading;
  const isError = workspacesQuery.isError || scansQuery.isError;

  if (isLoading) {
    return <LoadingSpinner message="Scanning workspaces..." fullPage />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-error space-y-4">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-mono">Failed to load workspaces.</p>
      </div>
    );
  }

  const workspaces = workspacesQuery.data || [];
  const scans = scansQuery.data || [];

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete workspace "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleTriggerScan = (id: string) => {
    setTriggeringId(id);
    triggerMutation.mutate(id);
  };

  // Helper to map last scan to workspace
  const getWorkspaceStats = (workspaceId: string) => {
    const wsScans = scans.filter((s) => s.workspace_id === workspaceId);
    const last = wsScans[0]; // sorted by start time desc in store
    return {
      lastScanTime: last ? new Date(last.started_at).toLocaleString() : 'Never',
      lastScanStatus: last?.status,
      lastDriftsCount: last?.summary?.total_findings,
    };
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Workspaces</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure cloud environments and parse Terraform state files for drift detection.
          </p>
        </div>
        <button
          onClick={() => navigate('/workspaces/new')}
          className="bg-terraform hover:bg-terraform/90 text-white font-medium py-2 px-4 rounded-lg text-sm inline-flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-terraform/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="border border-border/80 border-dashed rounded-2xl p-16 text-center space-y-4 bg-card/20">
          <Boxes className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">No workspaces found</p>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first workspace mapping a Terraform state to a cloud provider.
            </p>
          </div>
          <button
            onClick={() => navigate('/workspaces/new')}
            className="bg-terraform hover:bg-terraform/90 text-white font-medium py-2.5 px-5 rounded-lg text-sm inline-flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workspace</span>
          </button>
        </div>
      ) : (
        /* Workspaces Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workspaces.map((ws) => {
            const stats = getWorkspaceStats(ws.id);
            const isTriggering = triggeringId === ws.id;

            return (
              <Card key={ws.id} className="p-6 flex flex-col justify-between hover:border-terraform/40 border-border/60">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-bold text-foreground truncate max-w-[70%]">{ws.name}</h3>
                    <ProviderBadge provider={ws.provider} />
                  </div>

                  {/* Config details */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Cloud className="h-3.5 w-3.5 text-aws" />
                      <span>{ws.regions?.join(', ') || 'Global'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Server className="h-3.5 w-3.5 text-terraform" />
                      <span className="truncate max-w-[200px]" title={ws.state.backend === 'local' ? ws.state.path : `${ws.state.bucket}/${ws.state.key}`}>
                        {ws.state.backend === 'local' ? ws.state.path : `${ws.state.bucket}/${ws.state.key}`}
                      </span>
                    </div>
                  </div>

                  {/* Last Scan Info */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">Last Scan</p>
                      <p className="font-mono text-2xs text-muted-foreground/80">{stats.lastScanTime}</p>
                    </div>
                    <div>
                      {stats.lastScanStatus ? (
                        <div className="flex flex-col items-end space-y-1">
                          <StatusBadge status={stats.lastScanStatus} />
                          {stats.lastScanStatus === 'completed' && (
                            <span className={stats.lastDriftsCount > 0 ? 'text-aws text-2xs font-mono' : 'text-success text-2xs font-mono'}>
                              {stats.lastDriftsCount} drifts
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic font-mono text-2xs">Never Run</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-border/40">
                  <button
                    onClick={() => handleDelete(ws.id, ws.name)}
                    className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-lg transition-colors cursor-pointer"
                    title="Delete Workspace"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/workspaces/${ws.id}`)}
                      className="text-xs bg-border/40 border border-border text-foreground hover:bg-border px-3.5 py-2 rounded-lg font-medium inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => handleTriggerScan(ws.id)}
                      disabled={isTriggering || triggerMutation.isPending}
                      className="text-xs bg-terraform hover:bg-terraform/90 text-white px-3.5 py-2 rounded-lg font-medium inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isTriggering ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 fill-current" />
                      )}
                      <span>Scan</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
