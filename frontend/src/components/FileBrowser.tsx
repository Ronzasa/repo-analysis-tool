import { useState, useEffect } from 'react';
import { metricsApi } from '../services/api';

interface FileBrowserProps {
  repoId: string;
  onFileSelect: (path: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

function FileBrowser({ repoId, onFileSelect }: FileBrowserProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFileTree();
  }, [repoId]);

  const loadFileTree = async () => {
    try {
      setLoading(true);
      const response = await metricsApi.getByRepo(repoId);
      const metrics = response.data.metrics;
      
      // Build file tree from metrics
      const tree = buildFileTree(metrics);
      setFileTree(tree);
    } catch (err: any) {
      console.error('Failed to load file tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (metrics: any[]): FileNode[] => {
    const root: FileNode[] = [];
    const dirMap = new Map<string, FileNode>();

    // Create directory structure
    metrics.forEach(metric => {
      const path = metric.file_path || metric.dir_path;
      if (!path) return;

      const parts = path.split('/');
      let currentPath = '';

      parts.forEach((part: string, index: number) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!dirMap.has(currentPath)) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: index === parts.length - 1 && metric.file_path ? 'file' : 'directory',
            children: []
          };

          dirMap.set(currentPath, node);

          if (parentPath) {
            const parent = dirMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          } else {
            root.push(node);
          }
        }
      });
    });

    return root;
  };

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          onClick={() => {
            if (node.type === 'directory') {
              toggleDir(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
          style={{
            padding: '0.5rem 0.75rem',
            paddingLeft: `${depth * 1.5 + 0.75}rem`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '0.375rem',
            transition: 'background 0.2s ease',
            background: 'transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {node.type === 'directory' ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--primary-light)' }}>
              {isExpanded ? '📂' : '📁'}
            </span>
          ) : (
            <span style={{ fontSize: '0.875rem' }}>📄</span>
          )}
          <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{node.name}</span>
        </div>
        {node.type === 'directory' && isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading file tree...</div>;
  }

  return (
    <div className="card">
      <h3>File Browser</h3>
      <div style={{ marginTop: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
        {fileTree.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No files found
          </p>
        ) : (
          fileTree.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}

export default FileBrowser;
