import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createWorkspace, uploadStateFile } from '@/api/client';
import { Card } from '@/components/common/Card';
import { ArrowLeft, Save, Layers, Server, UploadCloud, FileJson, X, AlertTriangle } from 'lucide-react';
import type { StateConfig } from '@/api/types';

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [provider, setProvider] = useState('aws');
  const [regions, setRegions] = useState('us-east-1');
  const [backend, setBackend] = useState<'local' | 's3'>('local');

  // S3 state inputs
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Key, setS3Key] = useState('');
  const [s3Region, setS3Region] = useState('');

  // Compare config inputs
  const [ignoreTags, setIgnoreTags] = useState('driftctl_scan');
  const [ignoreAttrs, setIgnoreAttrs] = useState('');

  // File upload state variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'ready' | 'uploading' | 'success' | 'error'>('idle');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    setUploadError(null);
    setUploadStatus('validating');

    // 1. Extension validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'tfstate' && ext !== 'json') {
      setUploadError('Unsupported file format. Please upload a .tfstate or .json file.');
      setUploadStatus('error');
      return false;
    }

    // 2. Size validation (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit.');
      setUploadStatus('error');
      return false;
    }

    // 3. JSON format validation
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (backend === 'local' && (!selectedFile || uploadStatus !== 'ready')) {
      setSubmitError('Please upload a valid Terraform state file.');
      return;
    }

    setIsSubmitting(true);

    try {
      const stateConfig: StateConfig = {
        backend,
      };

      if (backend === 's3') {
        stateConfig.bucket = s3Bucket.trim();
        stateConfig.key = s3Key.trim();
        stateConfig.region = s3Region.trim() || 'us-east-1';
      }

      const regionsList = regions
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r !== '');

      const tagsIgnoreList = ignoreTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== '');

      const attrsIgnoreList = ignoreAttrs
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a !== '');

      // 1. Create Workspace configuration
      const wsData = await createWorkspace({
        name: name.trim(),
        provider,
        state: stateConfig,
        regions: regionsList,
        compare: {
          ignore_tags: tagsIgnoreList,
          ignore_attributes: attrsIgnoreList,
        },
      });

      // 2. Upload file if backend is local
      if (backend === 'local' && selectedFile) {
        setUploadStatus('uploading');
        await uploadStateFile(wsData.id, selectedFile);
        setUploadStatus('success');
      }

      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      navigate(`/workspaces/${wsData.id}`);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.response?.data?.error || 'Failed to create workspace. Please try again.');
      setUploadStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define how the drift engine fetches Terraform expected state and targets cloud providers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card className="p-8 space-y-6 border-border/60">
          {/* Workspace General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Workspace Name</label>
              <input
                type="text"
                placeholder="e.g. production-us-east"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Cloud Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform"
              >
                <option value="aws">AWS (Amazon Web Services)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Cloud Regions</label>
            <input
              type="text"
              placeholder="e.g. us-east-1, us-west-2 (comma separated)"
              value={regions}
              onChange={(e) => setRegions(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform font-mono"
              required
            />
            <p className="text-3xs text-muted-foreground leading-relaxed">
              Define target scan regions. If empty, the engine defaults to region metadata configured in the Terraform state.
            </p>
          </div>

          {/* Terraform State Configurations */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider block">State Backend Configuration</label>
            
            {/* Backend Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-background border border-border rounded-lg">
              <button
                type="button"
                onClick={() => setBackend('local')}
                className={`py-2 text-xs font-medium rounded-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  backend === 'local'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Server className="h-3.5 w-3.5" />
                <span>Upload State File</span>
              </button>
              <button
                type="button"
                onClick={() => setBackend('s3')}
                className={`py-2 text-xs font-medium rounded-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  backend === 's3'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-aws" />
                <span>AWS S3 Bucket</span>
              </button>
            </div>

            {/* Backend Fields */}
            {backend === 'local' ? (
              <div className="space-y-4 pt-2 animate-fade-in">
                <label className="text-2xs font-mono uppercase text-muted-foreground tracking-wider block">Terraform State File</label>
                
                {selectedFile ? (
                  <div className="border border-border rounded-xl p-4 bg-background/40 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileJson className="h-8 w-8 text-terraform" />
                      <div>
                        <p className="text-sm font-semibold text-foreground truncate max-w-[240px]" title={selectedFile.name}>
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
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="p-1.5 hover:bg-border/60 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      isDragActive
                        ? 'border-terraform bg-terraform/5'
                        : 'border-border hover:border-border/80 bg-background/20'
                    }`}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".tfstate,.json"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <UploadCloud className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      Drag & drop your state file here, or{' '}
                      <span className="text-terraform hover:underline font-semibold">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
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
              </div>
            ) : (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">S3 Bucket Name</label>
                    <input
                      type="text"
                      placeholder="e.g. my-company-tfstates"
                      value={s3Bucket}
                      onChange={(e) => setS3Bucket(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform font-mono"
                      required={backend === 's3'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">S3 Bucket Region</label>
                    <input
                      type="text"
                      placeholder="e.g. us-east-1"
                      value={s3Region}
                      onChange={(e) => setS3Region(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform font-mono"
                      required={backend === 's3'}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">S3 Object Key (Path)</label>
                  <input
                    type="text"
                    placeholder="e.g. production/network/terraform.tfstate"
                    value={s3Key}
                    onChange={(e) => setS3Key(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform font-mono"
                    required={backend === 's3'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advanced Compare configurations */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Drift Engine Exclusions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Ignored Tags</label>
                <input
                  type="text"
                  placeholder="e.g. driftctl_scan, Owner (comma separated)"
                  value={ignoreTags}
                  onChange={(e) => setIgnoreTags(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-2xs font-mono uppercase text-muted-foreground tracking-wider">Ignored Attributes</label>
                <input
                  type="text"
                  placeholder="e.g. timeouts, force_destroy (comma separated)"
                  value={ignoreAttrs}
                  onChange={(e) => setIgnoreAttrs(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-terraform"
                />
              </div>
            </div>
          </div>
        </Card>

        {submitError && (
          <div className="flex items-center space-x-2 text-xs text-error bg-error/10 border border-error/20 p-3 rounded-lg font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/workspaces')}
            className="px-5 py-2.5 bg-card border border-border text-foreground hover:bg-border/60 text-sm rounded-lg font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-terraform hover:bg-terraform/90 text-white font-medium py-2.5 px-5 rounded-lg text-sm inline-flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-terraform/20 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Saving...' : 'Create Workspace'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
