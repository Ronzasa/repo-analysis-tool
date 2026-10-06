import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repoApi } from '../services/api';

interface Repository {
  id: string;
  name: string;
  path: string;
  url?: string;
  created_at: number;
  updated_at: number;
}

function Dashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const response = await repoApi.list();
      setRepositories(response.data.repos);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await repoApi.delete(id);
      setRepositories(repositories.filter(repo => repo.id !== id));
    } catch (err: any) {
      alert(`Failed to delete repository: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading repositories...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={loadRepositories}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Repositories</h2>
        <Link to="/upload" className="btn btn-primary">Add Repository</Link>
      </div>

      {repositories.length === 0 ? (
        <div className="empty-state">
          <p>No repositories yet.</p>
          <Link to="/upload" className="btn btn-primary">Add Your First Repository</Link>
        </div>
      ) : (
        <div className="repo-grid">
          {repositories.map(repo => (
            <div key={repo.id} className="repo-card">
              <h3>{repo.name}</h3>
              <p className="repo-path">{repo.path}</p>
              {repo.url && <p className="repo-url">{repo.url}</p>}
              <div className="repo-meta">
                <span>Created: {new Date(repo.created_at * 1000).toLocaleDateString()}</span>
                <span>Updated: {new Date(repo.updated_at * 1000).toLocaleDateString()}</span>
              </div>
              <div className="repo-actions">
                <Link to={`/repo/${repo.id}`} className="btn btn-secondary">View Metrics</Link>
                <button 
                  onClick={() => handleDelete(repo.id, repo.name)} 
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
