import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function RepositoryView() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [repoRes, metricsRes] = await Promise.all([
        axios.get(`/api/repos/${id}`),
        axios.get(`/api/metrics/repo/${id}`)
      ]);
      setRepo(repoRes.data.repo);
      setMetrics(metricsRes.data.metrics);
    } catch (error) {
      console.error('Failed to load repository:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!repo) {
    return <div>Repository not found</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>{repo.name}</h2>
        <p>Path: {repo.path}</p>
      </div>

      {metrics && (
        <div className="grid grid-3">
          <div className="metric-card">
            <h3>Total Commits</h3>
            <div className="value">{metrics.commit_count || 0}</div>
          </div>
          <div className="metric-card">
            <h3>Lines Added</h3>
            <div className="value">{metrics.added_lines || 0}</div>
          </div>
          <div className="metric-card">
            <h3>Lines Removed</h3>
            <div className="value">{metrics.removed_lines || 0}</div>
          </div>
          <div className="metric-card">
            <h3>Net Growth</h3>
            <div className="value">{metrics.growth || 0}</div>
          </div>
          <div className="metric-card">
            <h3>Total Churn</h3>
            <div className="value">{metrics.churn || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepositoryView;
