import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkspace, getWorkspaceScans, deleteWorkspace, triggerScan, upsertSchedule, deleteSchedule, uploadStateFile } from '@/api/client';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/Loading';
import { ProviderBadge, StatusBadge } from '@/components/common/Badge';
import { Play, Trash2, Edit2, AlertCircle, AlertTriangle, ArrowLeft, Clock, Calendar, ShieldAlert, UploadCloud, FileJson, X, Check } from 'lucide-react';
import { useState } from 'react';

export default function WorkspaceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isTriggering, setIsTriggering] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cronInput, setCronInput] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // File upload state variables
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'ready' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);

  const workspaceQuery = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => getWorkspace(id!),
    enabled: !!id,
  });

  const scansQuery = useQuery({
    queryKey: ['workspaceScans', id],
    queryFn: () => getWorkspaceScans(id!),
    enabled: !!id,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerScan,
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['workspaceScans', id] });
      navigate(`/scans/${report.scan_id}`);
    },
    onSettled: () => {
      setIsTriggering(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      navigate('/workspaces');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ wsId, cron }: { wsId: string; cron: string }) => upsertSchedule(wsId, cron),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', id] });
      setShowScheduleModal(false);
    },
  });

  const unscheduleMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', id] });
      setShowScheduleModal(false);
    },
  });

  const handleTriggerScan = () => {
    if (!id) return;
    setIsTriggering(true);
    triggerMutation.mutate(id);
  };

  const handleDelete = () => {
    if (!id || !workspaceQuery.data) return;
    if (confirm(`Are you sure you want to delete workspace "${workspaceQuery.data.name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !cronInput.trim()) return;
    scheduleMutation.mutate({ wsId: id, cron: cronInput });
  };

  const handleRemoveSchedule = () => {
    if (!id) return;
    if (confirm('Are you sure you want to remove the scan schedule?')) {
      unscheduleMutation.mutate(id);
    }
  };

  const validateFile = (file: File) => {
    setUploadError(null);
    setUploadStatus('validating');

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'tfstate' && ext !== 'json') {
      setUploadError('Unsupported file format. Please upload a .tfstate or .json file.');
      setUploadStatus('error');
      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit.');
      setUploadStatus('error');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        JSON.parse(e.target?.result as string);
        setUploadStatus('ready');
      } catch (err) {
        setUploadError('Invalid JSON format. The file is not a valid Terraform state.');
        setUploadStatus('error');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setUploadStatus('error');
    };
    reader.readAsText(file);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      validateFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      validateFile(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadStatus('idle');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile || uploadStatus !== 'ready') return;

    setUploadStatus('uploading');
    try {
      const res = await uploadStateFile(id, selectedFile);
      setUploadStatus('success');
      setUploadedAt(new Date(res.uploaded_at).toLocaleString());
      queryClient.invalidateQueries({ queryKey: ['workspace', id] });
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Failed to upload state file.');
      setUploadStatus('error');
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadError(null);
    setUploadStatus('idle');
    setUploadedAt(null);
  };

  const isLoading = workspaceQuery.isLoading || scansQuery.isLoading;
  const isError = workspaceQuery.isError || scansQuery.isError;

  if (isLoading) {
    return <LoadingSpinner message="Querying workspace details..." fullPage />;
  }

  if (isError || !workspaceQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-error space-y-4">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-mono">Workspace details not found.</p>
        <button
          onClick={() => navigate('/workspaces')}
          className="text-xs text-terraform underline animate-fade-in"
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  const ws = workspaceQuery.data;
  const scans = scansQuery.data || [];

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/workspaces')}
        className="inline-flex items-center space-x-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3 w-3" />
        <span>Back to Workspaces</span>
      </button>

      {/* Main Info Card */}
      <Card className="p-8 border-border/60">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{ws.name}</h2>
              <ProviderBadge provider={ws.provider} />
              {ws.schedule && (
                <span className="px-2.5 py-0.5 rounded bg-terraform/10 text-terraform border border-terraform/20 text-xs font-mono inline-flex items-center space-x-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Scheduled: {ws.schedule.cron}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              VPC, EC2 instances, S3 buckets, and subnets mapping inside target cloud configuration.
            </p>

            {/* Config Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-1">
                <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Regions</p>
                <p className="text-sm font-semibold text-foreground">{ws.regions?.join(', ') || 'Global'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Terraform State Backend</p>
                <p className="text-sm font-semibold text-foreground uppercase">
                  {ws.state.backend === 'local' ? 'Uploaded State File' : 'AWS S3 Bucket'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">State File Location</p>
                <p className="text-sm font-semibold text-foreground truncate font-mono text-xs max-w-xs" title={ws.state.backend === 'local' ? (ws.state.path || '') : `${ws.state.bucket}/${ws.state.key}`}>
                  {ws.state.backend === 'local'
                    ? (ws.state.path || '').split(/[\/\\]/).pop() || ws.state.path || ''
                    : `${ws.state.bucket}/${ws.state.key}`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[180px]">
            <button
              onClick={handleTriggerScan}
              disabled={isTriggering || triggerMutation.isPending}
              className="bg-terraform hover:bg-terraform/90 text-white font-medium py-2.5 px-4 rounded-lg text-sm inline-flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-terraform/20 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isTriggering ? 'Running Scan...' : 'Run Scan'}</span>
            </button>

            {ws.state.backend === 'local' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-card border border-border text-foreground hover:bg-border/60 font-medium py-2 px-4 rounded-lg text-sm inline-flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Replace State</span>
              </button>
            )}

            <button
              onClick={() => {
                setCronInput(ws.schedule?.cron || '');
                setShowScheduleModal(true);
              }}
              className="bg-card border border-border text-foreground hover:bg-border/60 font-medium py-2 px-4 rounded-lg text-sm inline-flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule Scan</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 bg-card border border-border text-foreground hover:bg-border/60 py-2 px-3 rounded-lg text-sm inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-card border border-border/80 text-muted-foreground hover:text-error hover:bg-error/10 hover:border-error/20 py-2 px-3 rounded-lg text-sm inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Scans List Section */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Scan Executions</h3>
          <p className="text-xs text-muted-foreground">Historical drift report outputs from manual and cron triggers.</p>
        </div>

        {scans.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium">No scans run yet</p>
            <p className="text-xs text-muted-foreground/80">Trigger a scan to identify cloud configuration changes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-2xs font-mono uppercase text-muted-foreground">
                  <th className="py-4 px-6">Scan ID</th>
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
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Unavailable Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 border-border bg-card shadow-2xl space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-aws/10 text-aws rounded-xl border border-aws/20">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-foreground text-lg">Edit Option Unavailable</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Go REST backend API does not currently support direct workspace editing.
                  Specifically, the REST endpoint:
                </p>
                <code className="block p-2 bg-background border border-border rounded text-2xs font-mono text-error">
                  PUT /api/v1/workspaces/{`{id}`}
                </code>
                <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                  is not implemented by the backend.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-border flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-border/50 text-foreground border border-border text-xs rounded-lg hover:bg-border font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  handleDelete();
                }}
                className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/25 text-xs rounded-lg font-medium cursor-pointer"
              >
                Delete & Recreate
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Upsert Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 border-border bg-card shadow-2xl space-y-6">
            <div>
              <h4 className="font-bold text-foreground text-lg">Configure Scan Schedule</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Upsert or delete a standard cron expression to run automated drift detection scans.
              </p>
            </div>
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Cron Expression</label>
                <input
                  type="text"
                  placeholder="e.g. 0 */6 * * *"
                  value={cronInput}
                  onChange={(e) => setCronInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform font-mono"
                  required
                />
                <p className="text-3xs text-muted-foreground leading-relaxed">
                  Format: minute hour day-of-month month day-of-week (5-field expression).
                </p>
              </div>

              <div className="pt-4 border-t border-border flex justify-between">
                {ws.schedule ? (
                  <button
                    type="button"
                    onClick={handleRemoveSchedule}
                    className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/25 text-xs rounded-lg font-medium cursor-pointer"
                  >
                    Remove Schedule
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-border/50 text-foreground border border-border text-xs rounded-lg hover:bg-border font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-terraform hover:bg-terraform/90 text-white text-xs rounded-lg font-medium cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* State File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 border-border bg-card shadow-2xl space-y-6">
            <div>
              <h4 className="font-bold text-foreground text-lg">Replace State File</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a new Terraform state file to overwrite the current state configuration.
              </p>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadStatus === 'success' ? (
                <div className="border border-success/30 rounded-xl p-6 bg-success/5 text-center space-y-3">
                  <div className="h-10 w-10 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto border border-success/20">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-success font-mono">
                      ✓ terraform.tfstate uploaded successfully
                    </p>
                    {uploadedAt && (
                      <p className="text-3xs text-muted-foreground font-mono">
                        Timestamp: {uploadedAt}
                      </p>
                    )}
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="border border-border rounded-xl p-4 bg-background/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileJson className="h-8 w-8 text-terraform" />
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate max-w-[200px]" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB | Status:{' '}
                        <span className={
                          uploadStatus === 'ready' ? 'text-success font-semibold font-mono' :
                          uploadStatus === 'error' ? 'text-error font-semibold font-mono' :
                          uploadStatus === 'uploading' ? 'text-go font-semibold font-mono animate-pulse' :
                          'text-go font-semibold font-mono'
                        }>
                          {uploadStatus.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                  {uploadStatus !== 'uploading' && (
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="p-1.5 hover:bg-border/60 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    isDragActive
                      ? 'border-terraform bg-terraform/5'
                      : 'border-border hover:border-border/80 bg-background/20'
                  }`}
                  onClick={() => document.getElementById('details-file-input')?.click()}
                >
                  <input
                    id="details-file-input"
                    type="file"
                    accept=".tfstate,.json"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <UploadCloud className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    Drag & drop your state file here, or{' '}
                    <span className="text-terraform hover:underline font-semibold">browse</span>
                  </p>
                  <p className="text-3xs text-muted-foreground mt-1 font-mono">
                    Accepts: *.tfstate, *.json (Max 20MB)
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center space-x-2 text-xs text-error bg-error/10 border border-error/20 p-3 rounded-lg font-mono">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="pt-4 border-t border-border flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  className="px-4 py-2 bg-border/50 text-foreground border border-border text-xs rounded-lg hover:bg-border font-medium cursor-pointer"
                >
                  {uploadStatus === 'success' ? 'Done' : 'Cancel'}
                </button>
                {uploadStatus !== 'success' && (
                  <button
                    type="submit"
                    disabled={uploadStatus !== 'ready'}
                    className="px-4 py-2 bg-terraform hover:bg-terraform/90 text-white text-xs rounded-lg font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
