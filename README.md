# Repository Analysis Tool (RAT)

A web-based dashboard for analyzing Git repositories and calculating comprehensive code metrics.

**COMS3011A Test Submission - University of the Witwatersrand**

## Quick Start

### Prerequisites
- **Node.js 18+** (includes npm)
- **Python 3.10+** (includes pip)
- **Git**

### Running the Application

**Option 1: Using the start script (recommended)**
```bash
chmod +x start.sh
./start.sh
```

**Option 2: Manual start**
```bash
# Terminal 1 - Start Git Service (Python)
cd git-service
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 - Start Backend API (Node.js)
cd backend
npm install
npm run dev

# Terminal 3 - Start Frontend (React)
cd frontend
npm install
npm run dev
```

### Access the Application
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Git Service**: http://localhost:8000

## Architecture

The application uses a hybrid microservices architecture:

- **Frontend**: React + TypeScript + Vite - Dashboard UI
- **Backend API**: Node.js + Fastify - Handles web requests and data storage
- **Git Processing Service**: Python + FastAPI + pygit2 - Git operations and metric calculations
- **Database**: SQLite - Stores repository metadata and computed metrics

## Features

### Core Metrics (All 5 Categories)
- **File Metrics**: Added lines, removed lines, growth, churn per file
- **Directory Metrics**: Aggregated metrics from immediate children
- **Repository Metrics**: Whole repository overview
- **Commit Set Metrics**: Time-based analysis with modification frequency
- **Author Metrics**: Contributions, churn, and ownership percentage

### Data Ingestion
- Clone repositories from remote URLs (GitHub, GitLab, etc.)
- Upload ZIP files for local repositories

### Advanced Features
- **Filtering**: Filter metrics by time period, author, file/directory, and commit hashes
- **Author Merging**: Merge duplicate author identities via UI or .mailmap files
- **Multi-Repository Support**: Manage and compare multiple repositories
- **File Browser**: Interactive tree view of repository structure
- **Advanced Visualizations**: Line charts (commits over time), bar charts (top contributors), pie charts (file type distribution)

### Performance
- **Metric Caching**: SQLite-backed cache with TTL to avoid redundant calculations
- **Batch Processing**: Handles large repositories (60k+ commits) efficiently
- **Progress Tracking**: Real-time progress updates for long-running operations

## API Endpoints

### Backend API (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/repos` | List all repositories |
| GET | `/api/repos/:id` | Get repository details |
| POST | `/api/repos` | Create a new repository |
| DELETE | `/api/repos/:id` | Delete a repository |
| GET | `/api/metrics/repo/:repoId` | Get all metrics for a repository |
| GET | `/api/metrics/commit/:commitHash` | Get metrics for a commit |
| GET | `/api/metrics/file` | Get file metrics (with filters) |
| GET | `/api/metrics/directory` | Get directory metrics (with filters) |
| GET | `/api/authors` | List all authors |
| GET | `/api/authors/repo/:repoId` | Get authors for a repository |
| POST | `/api/authors/merge` | Merge duplicate authors |
| POST | `/api/analyze/:repoId` | Trigger full repository analysis |

### Git Service API (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/analyze` | Analyze repository (internal) |

## Running Tests

```bash
# Backend tests (84 tests)
cd backend
npm test

# Frontend build check
cd frontend
npm run build
```

## Project Structure

```
repo-analysis-tool/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic (repo, author, metric, cache, batch, progress)
│   │   ├── database.ts     # SQLite database setup
│   │   └── server.ts       # Fastify server entry point
│   └── tests/              # Jest test files
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── pages/          # Page components (Dashboard, RepositoryView, Authors, AuthorMerge, UploadRepo)
│   │   ├── components/     # Reusable components (FileBrowser, AdvancedCharts)
│   │   └── services/       # API client
├── git-service/             # Python git processing service
│   └── app/
│       ├── api/            # FastAPI endpoints
│       └── core/           # Git operations and metric calculations
├── start.sh                 # Quick start script
└── README.md                # This file
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Recharts, Axios, React Router
- **Backend**: Node.js, Fastify, TypeScript, sql.js (SQLite), Jest, Supertest
- **Git Service**: Python 3, FastAPI, pygit2 (libgit2 C bindings)
- **Database**: SQLite (via sql.js)

## License

MIT
