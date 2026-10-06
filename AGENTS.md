# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

Repository Analysis Tool (RAT) - A web-based dashboard for analyzing Git repositories and calculating comprehensive code metrics. Built for the COMS3011A test at Wits University.

## Architecture

**Hybrid microservices architecture:**
- **Frontend** (`/frontend`): React + TypeScript + Vite - Dashboard UI on port 5173 (dev) or 80 (prod)
- **Backend API** (`/backend`): Node.js + Fastify - Handles web requests, file uploads, serves UI. Port 3000
- **Git Processing Service** (`/git-service`): Python + FastAPI + pygit2 - Intensive git operations and metric calculations. Port 5000
- **Database**: SQLite - Shared between services, stored in `/data/rat.db`

**Data flow:** Frontend → Backend API → Git Service → pygit2 → SQLite

## Common Commands

### Docker (Recommended)
```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

### Local Development

**Backend (Node.js):**
```bash
cd backend
npm install
npm run dev          # Development mode with hot reload
npm run build        # Build for production
npm start            # Run production build
```

**Git Service (Python):**
```bash
cd git-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

**Frontend (React):**
```bash
cd frontend
npm install
npm run dev          # Development server on port 5173
npm run build        # Build for production
```

## Project Structure

```
repo-analysis-tool/
├── backend/              # Node.js Fastify API
│   ├── src/
│   │   ├── routes/      # API endpoints (upload, repo, metrics)
│   │   ├── server.ts    # Fastify server setup
│   │   ├── config.ts    # Configuration
│   │   └── database.ts  # SQLite setup and schema
│   └── package.json
├── git-service/         # Python git processing
│   ├── app/
│   │   ├── api/endpoints/  # FastAPI endpoints
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── metrics/calculator.py  # Metric calculations with pygit2
│   │   └── main.py
│   └── requirements.txt
├── frontend/            # React dashboard
│   ├── src/
│   │   ├── pages/      # Dashboard, UploadRepo, RepositoryView
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── data/               # Runtime data (gitignored)
│   ├── rat.db         # SQLite database
│   ├── repos/         # Cloned repositories
│   └── uploads/       # Uploaded zip files
└── docker-compose.yml
```

## Key Implementation Details

### Metric Calculation (git-service/app/core/metrics/calculator.py)
- Uses pygit2 (C bindings to libgit2) for fast git operations
- Processes commits from HEAD, skipping merge commits
- Enables rename detection with `diff.find_similar()`
- Excludes binary files via `patch.delta.is_binary`
- Calculates: added/removed lines, growth, churn, modifications, ownership

### Database Schema (backend/src/database.ts)
- `repositories`: Stored repos with metadata
- `authors`: Author information with merge support
- `file_metrics`: Per-file metrics per commit
- `directory_metrics`: Per-directory metrics per commit

### API Integration
- Backend proxies metric requests to git-service
- Git service endpoints accept: repo_id, file/dir path, time filters, commit list
- All metric calculations are on-demand (can be cached later)

## Important Technical Details

### Git Operations
- Non-merge commits only (reachable from HEAD)
- Binary files excluded from metrics
- Rename detection threshold: 50% (configurable in config)
- Deletions recorded as changes on the deleted path

### Metric Formulas
- **File Growth**: `added_lines - removed_lines`
- **File Churn**: `added_lines + removed_lines`
- **Directory Metrics**: Aggregated from immediate children (files + subdirs)
- **Repository Metrics**: Directory metrics on root
- **Author Ownership**: `author_churn / total_churn`

### Performance Considerations
- Large repos (100k+ commits) need batching
- Use `git log` with custom formatting for batch operations
- Cache computed metrics in database
- Process commits in chunks to manage memory

## Testing

Test repositories specified in brief:
- cJSON: https://github.com/DaveGamble/cJSON.git
- Redis: https://github.com/redis/redis.git
- Git: https://github.com/git/git.git

## Common Development Tasks

### Adding a New Metric
1. Add calculation method in `git-service/app/core/metrics/calculator.py`
2. Add endpoint in `git-service/app/api/endpoints/metrics.py`
3. Add proxy endpoint in `backend/src/routes/metrics.routes.ts`
4. Add UI component in `frontend/src/pages/` or `frontend/src/components/`

### Debugging
- Backend logs: `docker-compose logs backend`
- Git service logs: `docker-compose logs git-service`
- Frontend logs: Check browser console
- Database: Use SQLite browser or `sqlite3 data/rat.db`

### Environment Variables
- Backend: `PORT`, `GIT_SERVICE_URL` (default: http://localhost:5000)
- Git Service: `REPOS_DIR` (default: ./repos)

## Rubric Requirements (COMS3011A)

**50% Requirements:**
- Implement all metric categories (repo, file, directory, set, author)
- Support both zip upload and remote URL cloning
- Implement filtering, author merge, multi-repo support

**25% Architecture & UI:**
- Efficient metric computation algorithms
- Good visualization of metrics

**25% Usability:**
- Good navigation and error handling
- Performance on large repos (100k commits)
- Quality of life features
