import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Repository {
  id: string;
  name: string;
  path: string;
  url?: string;
  created_at: number;
}

function Dashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const response = await axios.get('/api/repos');
      setRepositories(response.data.repos || []);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRepository = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;
    
    try {
      await axios.delete(`/api/repos/${id}`);
      setRepositories(repos => repos.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete repository:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Repositories</h2>
        {repositories.length === 0 ? (
          <p>No repositories yet. <Link to="/upload">Upload one now</Link></p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Path</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map(repo => (
                <tr key={repo.id}>
                  <td>
                    <Link to={`/repo/${repo.id}`}>{repo.name}</Link>
                  </td>
                  <td>{repo.path}</td>
                  <td>{new Date(repo.created_at * 1000).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => deleteRepository(repo.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
