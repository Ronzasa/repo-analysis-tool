import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authorsApi } from '../services/api';

interface Author {
  id: string;
  name: string;
  email: string;
  merged_into?: string | null;
}

function AuthorMerge() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [targetAuthor, setTargetAuthor] = useState<string>('');
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      const response = await authorsApi.list();
      setAuthors(response.data.authors.filter((a: Author) => !a.merged_into));
    } catch (err: any) {
      console.error('Failed to load authors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAuthor = (authorId: string) => {
    if (selectedAuthors.includes(authorId)) {
      setSelectedAuthors(selectedAuthors.filter(id => id !== authorId));
    } else {
      setSelectedAuthors([...selectedAuthors, authorId]);
    }
  };

  const handleMerge = async () => {
    if (selectedAuthors.length === 0 || !targetAuthor) {
      alert('Please select authors to merge and a target author');
      return;
    }

    if (selectedAuthors.includes(targetAuthor)) {
      alert('Target author cannot be in the list of authors to merge');
      return;
    }

    setMerging(true);
    try {
      await authorsApi.merge(selectedAuthors, targetAuthor);
      alert('Authors merged successfully!');
      setSelectedAuthors([]);
      setTargetAuthor('');
      await loadAuthors();
    } catch (err: any) {
      alert(`Failed to merge authors: ${err.message}`);
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading authors...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">← Back to Dashboard</Link>
          <h2>Merge Authors</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Combine duplicate author identities into a single author
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Instructions</h3>
        <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
          <li>Select the target author (the one to keep)</li>
          <li>Select the authors to merge into the target</li>
          <li>Click "Merge Authors" to combine them</li>
          <li>All metrics from merged authors will be transferred to the target</li>
        </ol>
      </div>

      <div className="card">
        <h3>Select Target Author</h3>
        <div className="form-group">
          <label>Target Author (will keep this identity)</label>
          <select
            className="input"
            value={targetAuthor}
            onChange={(e) => setTargetAuthor(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">-- Select Target Author --</option>
            {authors.map(author => (
              <option key={author.id} value={author.id}>
                {author.name} ({author.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h3>Select Authors to Merge ({selectedAuthors.length} selected)</h3>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          {authors
            .filter(author => author.id !== targetAuthor)
            .map(author => (
              <div
                key={author.id}
                onClick={() => handleSelectAuthor(author.id)}
                style={{
                  padding: '1rem',
                  border: `2px solid ${selectedAuthors.includes(author.id) ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: selectedAuthors.includes(author.id) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedAuthors.includes(author.id)}
                    onChange={() => {}}
                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{author.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{author.email}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={handleMerge}
          disabled={merging || selectedAuthors.length === 0 || !targetAuthor}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          {merging ? 'Merging...' : `Merge ${selectedAuthors.length} Author(s)`}
        </button>
        <button
          onClick={() => {
            setSelectedAuthors([]);
            setTargetAuthor('');
          }}
          className="btn btn-secondary"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}

export default AuthorMerge;
