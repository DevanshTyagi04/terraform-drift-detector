import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/common/Card';
import { Activity, ShieldAlert } from 'lucide-react';

export default function Settings() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await axios.get<{ status: string }>('/health');
      return data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Diagnostics and status parameters of the Go daemon drift detection engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Diagnostics */}
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Engine Diagnostics</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Core engine configuration parameters.</p>
          </div>

          <div className="space-y-4 text-sm font-mono">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Go Version</span>
              <span className="text-foreground">go1.25.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Vite React App</span>
              <span className="text-foreground">v2.0.0-react</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Supported Providers</span>
              <span className="text-go">AWS (EC2, S3, VPC, Subnet, SG)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Database Storage</span>
              <span className="text-foreground">SQLite (driftctl.db)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Local Host OS</span>
              <span className="text-foreground">Windows x64</span>
            </div>
          </div>
        </Card>

        {/* Server Status & Connections */}
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Server Connection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Status checks on backend REST API connectivity.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-background/50 border border-border rounded-xl">
              <Activity className="h-5 w-5 text-go animate-pulse" />
              <div>
                <p className="text-xs font-mono uppercase text-muted-foreground">REST Endpoint status</p>
                <p className="text-sm font-semibold text-foreground">
                  {healthQuery.isLoading
                    ? 'Checking...'
                    : healthQuery.isError
                    ? 'DISCONNECTED'
                    : `CONNECTED (Status: ${healthQuery.data?.status?.toUpperCase()})`}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-muted-foreground leading-relaxed">
              <ShieldAlert className="h-4 w-4 text-aws shrink-0 mt-0.5" />
              <p>
                API request keys are currently unset on this host. For production deployments, ensure the{' '}
                <code className="p-1 px-1.5 bg-background border border-border rounded text-2xs font-mono text-aws">
                  api.api_key
                </code>{' '}
                variable is populated inside `configs/driftctl.yaml` to enforce header authentication.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
