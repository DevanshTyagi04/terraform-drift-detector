import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getScan } from '@/api/client';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/Loading';
import { StatusBadge, DriftKindBadge, SeverityBadge } from '@/components/common/Badge';
import { ArrowLeft, AlertTriangle, AlertCircle, RefreshCw, Search, ChevronDown, ChevronUp, Layers, Terminal } from 'lucide-react';
import { useState } from 'react';

export default function ScanDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const scanQuery = useQuery({
    queryKey: ['scan', id],
    queryFn: () => getScan(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && data.status === 'running' ? 2500 : false;
    },
  });

  const isLoading = scanQuery.isLoading;
  const isError = scanQuery.isError;

  if (isLoading) {
    return <LoadingSpinner message="Reconstructing drift snapshot..." fullPage />;
  }

  if (isError || !scanQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-error space-y-4">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-mono">Scan report not found.</p>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-terraform underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const report = scanQuery.data;

  // Calculate duration
  const start = new Date(report.started_at);
  const end = new Date(report.completed_at);
  const durationSec = report.status === 'running'
    ? Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000))
    : Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  // Extract all unique resource types for filter dropdown
  const uniqueTypes = Array.from(new Set((report.findings || []).map((f) => f.resource_type)));

  // Filter findings
  const filteredFindings = (report.findings || []).filter((f) => {
    const matchesSearch =
      f.resource_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.resource_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.field || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesType = typeFilter === 'all' || f.resource_type === typeFilter;

    return matchesSearch && matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(report.workspace_id ? `/workspaces/${report.workspace_id}` : '/')}
          className="inline-flex items-center space-x-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Workspace</span>
        </button>

        {report.status === 'running' && (
          <div className="flex items-center space-x-2 text-xs font-mono text-go">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Scanning Cloud Resources...</span>
          </div>
        )}
      </div>

      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Drift Report</span>
            <span className="text-muted-foreground font-mono text-xs font-normal">#{report.scan_id.slice(0, 8)}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Workspace: <span className="font-semibold text-foreground">{report.workspace || 'Adhoc'}</span>
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="space-y-1 text-right">
            <p className="text-muted-foreground uppercase text-2xs">Duration</p>
            <p className="text-sm text-foreground font-semibold">{formatDuration(durationSec)}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="space-y-1 text-right">
            <p className="text-muted-foreground uppercase text-2xs">Status</p>
            <StatusBadge status={report.status} />
          </div>
        </div>
      </div>

      {/* Summary Matrix Cards */}
      {report.status === 'completed' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-5 flex flex-col justify-between">
            <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Total Findings</p>
            <p className="text-2xl font-bold text-foreground mt-2">{report.summary.total_findings}</p>
          </Card>
          <Card className="p-5 flex flex-col justify-between border-l-4 border-l-error">
            <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Missing in Cloud</p>
            <p className="text-2xl font-bold text-error mt-2">{report.summary.missing_in_cloud}</p>
          </Card>
          <Card className="p-5 flex flex-col justify-between border-l-4 border-l-aws">
            <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Extra in Cloud</p>
            <p className="text-2xl font-bold text-aws mt-2">{report.summary.extra_in_cloud}</p>
          </Card>
          <Card className="p-5 flex flex-col justify-between border-l-4 border-l-warning">
            <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Attribute Drift</p>
            <p className="text-2xl font-bold text-warning mt-2">{report.summary.attribute_changes}</p>
          </Card>
          <Card className="p-5 flex flex-col justify-between border-l-4 border-l-terraform">
            <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Tag Drift</p>
            <p className="text-2xl font-bold text-terraform mt-2">{report.summary.tag_changes}</p>
          </Card>
        </div>
      )}

      {/* Errors Banner */}
      {report.errors && report.errors.length > 0 && (
        <Card className="p-4 bg-error/10 border-error/20 flex items-start space-x-3 text-error">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Scan completed with errors</p>
            <ul className="list-disc pl-5 text-xs font-mono space-y-1">
              {report.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Findings Table Panel */}
      <Card className="overflow-hidden">
        {/* Table Control Header */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/45">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Detected Drift</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Differences detected between Terraform state definitions and live cloud resources.
            </p>
          </div>

          {/* Filters Area */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-none focus:border-terraform w-56 font-mono"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-terraform font-mono cursor-pointer"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-terraform font-mono cursor-pointer"
            >
              <option value="all">Resource Type: All</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table/List View */}
        {filteredFindings.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-2">
            <Layers className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-semibold">No drift findings</p>
            <p className="text-xs text-muted-foreground/80">
              No matching differences were found based on the active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-2xs font-mono uppercase text-muted-foreground">
                  <th className="py-4 px-6 w-8" />
                  <th className="py-4 px-6">Drift Kind</th>
                  <th className="py-4 px-6">Severity</th>
                  <th className="py-4 px-6">Resource ID / Name</th>
                  <th className="py-4 px-6">Resource Type</th>
                  <th className="py-4 px-6">Attribute Field</th>
                  <th className="py-4 px-6 text-right">View Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredFindings.map((f, idx) => {
                  const isExpanded = expandedRow === idx;
                  const hasDiff = f.expected !== undefined || f.actual !== undefined;

                  return (
                    <>
                      <tr
                        key={idx}
                        className={`hover:bg-border/20 transition-colors ${
                          isExpanded ? 'bg-border/10' : ''
                        }`}
                      >
                        <td className="py-4 px-6 text-center">
                          {hasDiff ? (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : idx)}
                              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-muted-foreground/30 font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <DriftKindBadge kind={f.kind} />
                        </td>
                        <td className="py-4 px-6">
                          <SeverityBadge severity={f.severity} />
                        </td>
                        <td className="py-4 px-6 font-semibold text-foreground max-w-[240px] truncate">
                          {f.resource_name || f.resource_id}
                          {f.resource_name && f.resource_name !== f.resource_id && (
                            <span className="block text-3xs font-mono text-muted-foreground font-normal truncate mt-0.5">
                              ID: {f.resource_id}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-muted-foreground">
                          {f.resource_type}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-muted-foreground">
                          {f.field || '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {hasDiff ? (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : idx)}
                              className="text-xs text-terraform hover:text-terraform/80 font-medium cursor-pointer"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono italic">No values</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable JSON Diff Row */}
                      {isExpanded && hasDiff && (
                        <tr className="bg-background/25">
                          <td colSpan={7} className="p-6 border-t border-b border-border/80">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                              <div className="space-y-2">
                                <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider flex items-center space-x-1.5">
                                  <Layers className="h-3.5 w-3.5 text-terraform" />
                                  <span>Expected (Terraform State configuration)</span>
                                </p>
                                <pre className="p-4 bg-background border border-border rounded-xl text-success overflow-x-auto max-h-[300px] overflow-y-auto">
                                  {f.expected !== null && f.expected !== undefined
                                    ? JSON.stringify(f.expected, null, 2)
                                    : 'NIL / DECLARED EMPTY'}
                                </pre>
                              </div>
                              <div className="space-y-2">
                                <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider flex items-center space-x-1.5">
                                  <Terminal className="h-3.5 w-3.5 text-aws" />
                                  <span>Actual (Live Cloud deployment)</span>
                                </p>
                                <pre className="p-4 bg-background border border-border rounded-xl text-error overflow-x-auto max-h-[300px] overflow-y-auto">
                                  {f.actual !== null && f.actual !== undefined
                                    ? JSON.stringify(f.actual, null, 2)
                                    : 'NIL / DELETED FROM CLOUD'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
