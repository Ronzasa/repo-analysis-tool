import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RepositoryView from './pages/RepositoryView';
import UploadRepo from './pages/UploadRepo';
import Authors from './pages/Authors';

function App() {
  return (
    <Router>
      <div className="header">
        <div className="header-content">
          <h1>Repository Analysis Tool</h1>
          <nav>
            <Link to="/" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <Link to="/authors" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>
              Authors
            </Link>
            <Link to="/upload" style={{ color: 'white', textDecoration: 'none' }}>
              Upload Repository
            </Link>
          </nav>
        </div>
      </div>
      
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadRepo />} />
          <Route path="/repo/:id" element={<RepositoryView />} />
          <Route path="/authors" element={<Authors />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
