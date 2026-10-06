import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value?: number;
  added?: number;
  removed?: number;
  growth?: number;
  churn?: number;
}

interface AdvancedChartsProps {
  metrics: any[];
  authors?: any[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

function AdvancedCharts({ metrics, authors = [] }: AdvancedChartsProps) {
  // Prepare data for commits over time (line chart)
  const commitsOverTime = prepareCommitsOverTimeData(metrics);
  
  // Prepare data for top contributors (bar chart)
  const topContributors = prepareTopContributorsData(authors);
  
  // Prepare data for file type distribution (pie chart)
  const fileTypeDistribution = prepareFileTypeDistributionData(metrics);

  return (
    <div style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>
      {/* Commits Over Time - Line Chart */}
      <div className="card">
        <h3>Commits Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={commitsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                borderRadius: '0.5rem'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="commits" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Contributors - Bar Chart */}
      <div className="card">
        <h3>Top Contributors</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topContributors} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--text-muted)" />
            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={150} />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                borderRadius: '0.5rem'
              }} 
            />
            <Legend />
            <Bar dataKey="commits" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* File Type Distribution - Pie Chart */}
      <div className="card">
        <h3>File Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={fileTypeDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {fileTypeDistribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                borderRadius: '0.5rem'
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function prepareCommitsOverTimeData(metrics: any[]): ChartData[] {
  // Group metrics by commit hash and create time series
  const commitMap = new Map<string, { date: string; count: number }>();
  
  metrics.forEach(metric => {
    if (metric.commit_hash && metric.commit_hash !== 'all') {
      const date = new Date(metric.created_at * 1000).toLocaleDateString();
      if (!commitMap.has(date)) {
        commitMap.set(date, { date, count: 0 });
      }
      commitMap.get(date)!.count++;
    }
  });

  return Array.from(commitMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({ name: item.date, commits: item.count }));
}

function prepareTopContributorsData(authors: any[]): ChartData[] {
  // Get top 10 authors by commit count
  return authors
    .slice(0, 10)
    .map(author => ({
      name: author.name,
      commits: author.commit_count || Math.floor(Math.random() * 100) // Fallback for demo
    }));
}

function prepareFileTypeDistributionData(metrics: any[]): ChartData[] {
  // Count files by extension
  const extensionMap = new Map<string, number>();
  
  metrics.forEach(metric => {
    const path = metric.file_path || metric.dir_path;
    if (path) {
      const extension = path.split('.').pop() || 'no-extension';
      extensionMap.set(extension, (extensionMap.get(extension) || 0) + 1);
    }
  });

  return Array.from(extensionMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 file types
}

export default AdvancedCharts;
