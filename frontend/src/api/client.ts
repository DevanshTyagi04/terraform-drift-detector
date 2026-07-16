import axios from 'axios';
import type { Workspace, DriftReport } from './types';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const { data } = await api.get<Workspace[]>('/api/v1/workspaces');
  return data;
};

export const getWorkspace = async (id: string): Promise<Workspace> => {
  const { data } = await api.get<Workspace>(`/api/v1/workspaces/${id}`);
  return data;
};

export const createWorkspace = async (workspace: Omit<Workspace, 'id'>): Promise<Workspace> => {
  const { data } = await api.post<Workspace>('/api/v1/workspaces', workspace);
  return data;
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/workspaces/${id}`);
};

export const triggerScan = async (workspaceId: string): Promise<DriftReport> => {
  const { data } = await api.post<DriftReport>(`/api/v1/workspaces/${workspaceId}/scans`);
  return data;
};

export const getWorkspaceScans = async (workspaceId: string, limit = 50): Promise<DriftReport[]> => {
  const { data } = await api.get<DriftReport[]>(`/api/v1/workspaces/${workspaceId}/scans`, {
    params: { limit },
  });
  return data;
};

export const getScans = async (limit = 50): Promise<DriftReport[]> => {
  const { data } = await api.get<DriftReport[]>('/api/v1/scans', {
    params: { limit },
  });
  return data;
};

export const getScan = async (id: string): Promise<DriftReport> => {
  const { data } = await api.get<DriftReport>(`/api/v1/scans/${id}`);
  return data;
};

export const getScanReport = async (id: string, format = 'json'): Promise<string> => {
  const { data } = await api.get<string>(`/api/v1/scans/${id}/report`, {
    params: { format },
  });
  return data;
};

export const upsertSchedule = async (workspaceId: string, cron: string): Promise<{ workspace_id: string; cron: string }> => {
  const { data } = await api.put(`/api/v1/workspaces/${workspaceId}/schedules`, { cron });
  return data;
};

export const deleteSchedule = async (workspaceId: string): Promise<void> => {
  await api.delete(`/api/v1/workspaces/${workspaceId}/schedules`);
};

export const uploadStateFile = async (
  workspaceId: string,
  file: File
): Promise<{ workspace_id: string; uploaded_at: string; status: string }> => {
  const formData = new FormData();
  formData.append('state', file);
  const { data } = await api.post(`/api/v1/workspaces/${workspaceId}/state`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};
