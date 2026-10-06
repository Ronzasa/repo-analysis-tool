import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { repoApi, metricsApi, analysisApi, authorsApi } from '../services/api';
import FileBrowser from '../components/FileBrowser';
import AdvancedCharts from '../components/AdvancedCharts';

interface Repository {
  id: string;
  name: string;
  path: string;
  url?: string;
}

interface Metric {
  file_path?: string;
  dir_path?: string;
  added_lines: number;
  removed_lines: number;
  growth: number;
  churn: number;
}

function RepositoryView() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repoResponse, metricsResponse, authorsResponse] = await Promise.all([
        repoApi.get(id!),
        metricsApi.getByRepo(id!),
        authorsApi.getByRepo(id!)
      ]);
      setRepo(repoResponse.data.repo);
      setMetrics(metricsResponse.data.metrics);
      setAuthors(authorsResponse.data.authors || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load repository data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!id) return;

    setAnalyzing(true);
    try {
      const response = await analysisApi.trigger(id);
      alert(`Analysis completed!\n${response.data.message}\nFile metrics: ${response.data.stats.file_metrics_count}\nDirectory metrics: ${response.data.stats.directory_metrics_count}\nAuthors: ${response.data.stats.authors_count}`);
      await loadData();
    } catch (err: any) {
      if (err.response?.status === 503) {
        alert('Git service is not running. Please start the Python git-service on port 8000.');
      } else {
        alert(`Analysis failed: ${err.message}`);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading repository...</div>;
  }

  if (error || !repo) {
    return (
      <div className="error">
        <p>Error: {error || 'Repository not found'}</p>
        <Link to="/" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    );
  }

  // Aggregate metrics by file/directory for chart
  const chartData = metrics.slice(0, 10).map((m, idx) => ({
    name: m.file_path || m.dir_path || `Item ${idx}`,
    added: m.added_lines,
    removed: m.removed_lines,
    growth: m.growth,
    churn: m.churn
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">← Back to Dashboard</Link>
          <h2>{repo.name}</h2>
          <p className="repo-path">{repo.path}</p>
          {repo.url && <p className="repo-url">{repo.url}</p>}
        </div>
        <button 
          onClick={handleAnalyze} 
          disabled={analyzing}
          className="btn btn-primary"
        >
          {analyzing ? 'Analyzing...' : 'Analyze Repository'}
        </button>
      </div>

      {metrics.length === 0 ? (
        <div className="empty-state">
          <p>No metrics available yet.</p>
          <button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="btn btn-primary"
          >
            Run Analysis
          </button>
        </div>
      ) : (
        <>
          <div className="metrics-summary">
            <div className="metric-card">
              <h4>Total Files/Directories</h4>
              <p className="metric-value">{metrics.length}</p>
            </div>
            <div className="metric-card">
              <h4>Total Lines Added</h4>
              <p className="metric-value">{metrics.reduce((sum, m) => sum + m.added_lines, 0)}</p>
            </div>
            <div className="metric-card">
              <h4>Total Lines Removed</h4>
              <p className="metric-value">{metrics.reduce((sum, m) => sum + m.removed_lines, 0)}</p>
            </div>
            <div className="metric-card">
              <h4>Total Growth</h4>
              <p className="metric-value">{metrics.reduce((sum, m) => sum + m.growth, 0)}</p>
            </div>
          </div>

          <div className="card">
            <h3>Metrics Visualization (Top 10)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="added" fill="#4caf50" name="Lines Added" />
                <Bar dataKey="removed" fill="#f44336" name="Lines Removed" />
                <Bar dataKey="growth" fill="#2196f3" name="Growth" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
            <FileBrowser repoId={id!} onFileSelect={setSelectedFile} />
            
            <div className="card">
              <h3>Selected File Details</h3>
              {selectedFile ? (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedFile}</p>
                  {(() => {
                    const metric = metrics.find(m => (m.file_path || m.dir_path) === selectedFile);
                    if (metric) {
                      return (
                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Lines Added:</span>
                            <span className="positive">{metric.added_lines}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Lines Removed:</span>
                            <span className="negative">{metric.removed_lines}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Growth:</span>
                            <span>{metric.growth}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Churn:</span>
                            <span>{metric.churn}</span>
                          </div>
                        </div>
                      );
                    }
                    return <p style={{ color: 'var(--text-muted)' }}>No metrics available for this file</p>;
                  })()}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                  Select a file from the browser to view its metrics
                </p>
              )}
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
              className="btn btn-secondary"
            >
              {showAdvancedCharts ? 'Hide' : 'Show'} Advanced Charts
            </button>
          </div>

          {showAdvancedCharts && <AdvancedCharts metrics={metrics} authors={authors} />}

          <div className="card">
            <h3>Metrics Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Added</th>
                  <th>Removed</th>
                  <th>Growth</th>
                  <th>Churn</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, idx) => (
                  <tr key={idx}>
                    <td>{metric.file_path || metric.dir_path}</td>
                    <td className="positive">{metric.added_lines}</td>
                    <td className="negative">{metric.removed_lines}</td>
                    <td>{metric.growth}</td>
                    <td>{metric.churn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default RepositoryView;
