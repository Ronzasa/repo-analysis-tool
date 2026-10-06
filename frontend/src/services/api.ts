import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Repository API
export const repoApi = {
  list: () => api.get('/api/repos'),
  get: (id: string) => api.get(`/api/repos/${id}`),
  create: (data: { name: string; path: string; url?: string }) => 
    api.post('/api/repos', data),
  update: (id: string, data: Partial<{ name: string; path: string; url: string }>) => 
    api.put(`/api/repos/${id}`, data),
  delete: (id: string) => api.delete(`/api/repos/${id}`),
};

// Metrics API
export const metricsApi = {
  getByRepo: (repoId: string) => api.get(`/api/metrics/repo/${repoId}`),
  getByCommit: (commitHash: string) => api.get(`/api/metrics/commit/${commitHash}`),
  getFileMetrics: (filters: Record<string, any>) => 
    api.get('/api/metrics/file', { params: filters }),
  getAggregatedFileMetrics: (repoId: string, filePath: string) => 
    api.get('/api/metrics/file/aggregated', { params: { repo_id: repoId, file_path: filePath } }),
  getDirectoryMetrics: (filters: Record<string, any>) => 
    api.get('/api/metrics/directory', { params: filters }),
  getAggregatedDirectoryMetrics: (repoId: string, dirPath: string) => 
    api.get('/api/metrics/directory/aggregated', { params: { repo_id: repoId, dir_path: dirPath } }),
};

// Authors API
export const authorsApi = {
  list: (filter?: 'merged' | 'active') => 
    api.get('/api/authors', { params: filter ? { filter } : {} }),
  getByRepo: (repoId: string) => api.get(`/api/authors/repo/${repoId}`),
  get: (id: string) => api.get(`/api/authors/${id}`),
  getByEmail: (email: string) => api.get(`/api/authors/email/${email}`),
  getEffective: (id: string) => api.get(`/api/authors/${id}/effective`),
  create: (data: { id: string; name: string; email: string }) => 
    api.post('/api/authors', data),
  merge: (sourceIds: string[], targetId: string) => 
    api.post('/api/authors/merge', { source_ids: sourceIds, target_id: targetId }),
  delete: (id: string) => api.delete(`/api/authors/${id}`),
};

// Analysis API
export const analysisApi = {
  trigger: (repoId: string) => api.post(`/api/analyze/${repoId}`),
  getStatus: (repoId: string) => api.get(`/api/analyze/${repoId}/status`),
};

export default api;
