import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function UploadRepo() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/upload/clone', { url });
      navigate('/');
    } catch (err) {
      setError('Failed to clone repository');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post('/api/upload/zip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/');
    } catch (err) {
      setError('Failed to upload repository');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Clone from URL</h2>
        <form onSubmit={handleUrlSubmit}>
          <div className="form-group">
            <label>Repository URL</label>
            <input
              type="text"
              className="input"
              placeholder="https://github.com/user/repo.git"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Cloning...' : 'Clone Repository'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Upload ZIP File</h2>
        <form onSubmit={handleFileUpload}>
          <div className="form-group">
            <label>Select ZIP file</label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload Repository'}
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#fee', borderColor: '#fcc' }}>
          <p style={{ color: '#c33' }}>{error}</p>
        </div>
      )}
    </div>
  );
}

export default UploadRepo;
