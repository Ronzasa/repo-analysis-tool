# Repository Analysis Tool (RAT)

A web-based dashboard for analyzing Git repositories and calculating comprehensive code metrics.

## Overview

This tool provides insights into Git repositories by calculating metrics for files, directories, authors, and commit sets. It helps understand:
- How a repository has evolved over time
- Who has contributed the most impact
- Which parts of the codebase are most volatile

## Architecture

The application uses a hybrid architecture:

- **Frontend**: React + TypeScript + Vite - Dashboard UI
- **Backend API**: Node.js + Fastify - Handles web requests, file uploads, and serves the UI
- **Git Processing Service**: Python + FastAPI + pygit2 - Performs intensive git operations and metric calculations
- **Database**: SQLite - Stores repository metadata and computed metrics

## Features

- **Repository Upload**: Clone from URL or upload ZIP files
- **Multiple Repository Support**: Manage and analyze multiple repositories
- **Comprehensive Metrics**:
  - File metrics (added/removed lines, growth, churn)
  - Directory metrics (aggregated from immediate children)
  - Repository metrics (whole repo overview)
  - Commit set metrics (time-based analysis)
  - Author metrics (contributions and ownership)
- **Filtering**: Filter by repository, author, file/directory, and time period
- **Author Merging**: Support for .mailmap and manual author merging

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. Clone this repository
2. Start the services:
   ```bash
   docker-compose up --build
   ```
3. Access the dashboard at `http://localhost`

### Local Development

#### Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

#### Git Service (Python)
```bash
cd git-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

#### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Backend API (Port 3000)

- `GET /health` - Health check
- `POST /api/upload/zip` - Upload ZIP file
- `POST /api/upload/clone` - Clone from URL
- `GET /api/repos` - List repositories
- `GET /api/repos/:id` - Get repository details
- `DELETE /api/repos/:id` - Delete repository
- `GET /api/metrics/repo/:id` - Get repository metrics
- `GET /api/metrics/file/:repoId/:filePath` - Get file metrics
- `GET /api/metrics/directory/:repoId/:dirPath` - Get directory metrics
- `GET /api/metrics/author/:repoId/:author` - Get author metrics

### Git Service API (Port 5000)

- `GET /health` - Health check
- `POST /api/git/clone` - Clone repository
- `GET /api/git/info/:repo_id` - Get repository info
- `GET /api/metrics/file/:repo_id` - Calculate file metrics
- `GET /api/metrics/directory/:repo_id` - Calculate directory metrics
- `GET /api/metrics/repo/:repo_id` - Calculate repository metrics
- `GET /api/metrics/author/:repo_id` - Calculate author metrics

## Metrics

### File Metrics
- **Added Lines**: Number of lines added
- **Removed Lines**: Number of lines removed
- **Growth**: Net change (added - removed)
- **Churn**: Total changes (added + removed)

### Directory Metrics
Aggregated metrics from all immediate children (files and subdirectories)

### Repository Metrics
Same as directory metrics applied to the root

### Commit Set Metrics
- **Modifications**: Number of commits with changes
- **Modification Frequency**: Modifications / Total commits
- **Churn Rate**: Churn / Total commits

### Author Metrics
- **Author Modifications**: Commits by author with changes
- **Author Churn**: Total churn by author
- **Author Ownership**: Fraction of total churn attributed to author

## Configuration

Environment variables can be set in `.env` files:

### Backend
- `PORT`: Backend API port (default: 3000)
- `GIT_SERVICE_URL`: Git service URL (default: http://localhost:5000)

### Git Service
- `REPOS_DIR`: Directory for storing repositories (default: ./repos)

## Development Status

This project is under active development. Core features are being implemented to meet the COMS3011A test requirements.

## License

MIT
