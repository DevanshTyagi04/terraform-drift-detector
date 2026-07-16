export interface StateConfig {
  backend: string;
  path?: string;
  bucket?: string;
  key?: string;
  region?: string;
  extra?: Record<string, string>;
}

export interface CompareConfig {
  ignore_tags?: string[];
  ignore_attributes?: string[];
}

export interface ScheduleConfig {
  cron: string;
}

export interface Workspace {
  id: string;
  name: string;
  provider: string;
  state: StateConfig;
  regions: string[];
  compare: CompareConfig;
  schedule?: ScheduleConfig;
}

export type DriftKind = 'missing_in_cloud' | 'extra_in_cloud' | 'attribute_changed' | 'tags_changed';
export type Severity = 'info' | 'warning' | 'critical';

export interface DriftFinding {
  kind: DriftKind;
  resource_id: string;
  resource_type: string;
  resource_name?: string;
  field?: string;
  expected?: any;
  actual?: any;
  severity: Severity;
}

export interface DriftSummary {
  total_resources: number;
  missing_in_cloud: number;
  extra_in_cloud: number;
  attribute_changes: number;
  tag_changes: number;
  total_findings: number;
}

export interface DriftReport {
  scan_id: string;
  workspace_id?: string;
  workspace?: string;
  started_at: string;
  completed_at: string;
  status: 'running' | 'completed' | 'failed';
  summary: DriftSummary;
  findings: DriftFinding[];
  errors?: string[];
}

export interface DashboardStats {
  totalWorkspaces: number;
  totalScans: number;
  lastScanTime?: string;
  lastScanStatus?: string;
}
