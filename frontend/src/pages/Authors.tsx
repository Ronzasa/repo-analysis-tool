import { useState, useEffect } from 'react';
import { authorsApi } from '../services/api';

interface Author {
  id: string;
  name: string;
  email: string;
  merged_into?: string | null;
}

function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'merged' | 'active'>('all');

  useEffect(() => {
    loadAuthors();
  }, [filter]);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      const response = await authorsApi.list(filter === 'all' ? undefined : filter);
      setAuthors(response.data.authors);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load authors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await authorsApi.delete(id);
      setAuthors(authors.filter(author => author.id !== id));
    } catch (err: any) {
      alert(`Failed to delete author: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading authors...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={loadAuthors}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Authors</h2>
      </div>

      <div className="filter-bar">
        <button 
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Authors
        </button>
        <button 
          className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('active')}
        >
          Active Authors
        </button>
        <button 
          className={`btn ${filter === 'merged' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('merged')}
        >
          Merged Authors
        </button>
      </div>

      {authors.length === 0 ? (
        <div className="empty-state">
          <p>No authors found.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {authors.map(author => (
                <tr key={author.id}>
                  <td>{author.name}</td>
                  <td>{author.email}</td>
                  <td>
                    {author.merged_into ? (
                      <span className="badge badge-merged">Merged</span>
                    ) : (
                      <span className="badge badge-active">Active</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(author.id, author.name)} 
                      className="btn btn-danger btn-small"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Authors;
