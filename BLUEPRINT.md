# Development Blueprint - Repository Analysis Tool

## Overview
This blueprint provides a structured approach to implementing the Repository Analysis Tool within the 2.5-hour timeframe. Each phase builds on the previous one, with testing checkpoints to ensure correctness.

---

## Phase 0: Foundation & Testing Setup (15 minutes)

### Tasks
- [ ] **0.1** Initialize git repository and commit current structure
- [ ] **0.2** Set up testing frameworks:
  - Backend: Jest + Supertest
  - Git Service: pytest
  - Frontend: Vitest + React Testing Library
- [ ] **0.3** Create test directory structure:
  ```
  backend/tests/
  git-service/tests/
  frontend/src/__tests__/
  ```
- [ ] **0.4** Set up test database (separate from dev)
- [ ] **0.5** Create test utilities and helpers

### Testing Fundamentals
- **Unit Tests**: Test individual functions/methods in isolation
- **Integration Tests**: Test API endpoints with database
- **E2E Tests**: Test complete workflows (upload → analyze → view)
- **Validation Tests**: Compare metrics against known values

### Checkpoint
✅ All testing frameworks installed and configured  
✅ Can run tests with `npm test` / `pytest`  
✅ Test database initialized  

---

## Phase 1: Git Operations Core (30 minutes)

### Tasks
- [ ] **1.1** Implement repository cloning (URL → local path)
  - File: `git-service/app/core/git/operations.py`
  - Function: `clone_repository(url: str, target_path: str) -> str`
  - Test: Clone small repo (cJSON)
  
- [ ] **1.2** Implement ZIP extraction
  - File: `backend/src/services/zip.service.ts`
  - Function: `extractZip(buffer: Buffer, targetPath: string) -> Promise<string>`
  - Test: Extract sample zip file
  
- [ ] **1.3** Implement commit iteration
  - File: `git-service/app/core/metrics/calculator.py`
  - Function: `get_commits(repo_path, start_time, end_time, commit_hashes) -> List[Commit]`
  - Requirements:
    - Skip merge commits
    - Support time filtering
    - Support specific commit list
  - Test: Iterate commits in cJSON repo
  
- [ ] **1.4** Implement diff parsing
  - File: `git-service/app/core/metrics/calculator.py`
  - Function: `get_diff_stats(commit: Commit) -> Dict[str, Dict[str, int]]`
  - Requirements:
    - Enable rename detection (50% threshold)
    - Exclude binary files
    - Track additions/deletions per file
  - Test: Parse diffs with known values

### Testing
```python
# git-service/tests/test_git_operations.py
def test_clone_repository():
    url = "https://github.com/DaveGamble/cJSON.git"
    path = clone_repository(url, "/tmp/test")
    assert Path(path).exists()
    assert (Path(path) / ".git").exists()

def test_commit_iteration():
    commits = get_commits("/path/to/cjson")
    assert len(commits) > 0
    # Verify no merge commits
    for commit in commits:
        assert len(commit.parents) <= 1

def test_diff_parsing():
    commit = get_commits("/path/to/cjson")[0]
    stats = get_diff_stats(commit)
    assert "additions" in stats["some_file.c"]
    assert "deletions" in stats["some_file.c"]
```

### Checkpoint
✅ Can clone repositories from URL  
✅ Can extract ZIP files  
✅ Can iterate commits (excluding merges)  
✅ Can parse diffs with rename detection  
✅ All unit tests passing  

---

## Phase 2: Metric Calculations (45 minutes)

### Tasks
- [ ] **2.1** Implement file metrics
  - File: `git-service/app/core/metrics/calculator.py`
  - Function: `calculate_file_metrics(file_path, ...) -> Dict`
  - Metrics: added_lines, removed_lines, growth, churn
  - Test: Calculate for known file in cJSON
  
- [ ] **2.2** Implement directory metrics
  - File: `git-service/app/core/metrics/calculator.py`
  - Function: `calculate_directory_metrics(dir_path, ...) -> Dict`
  - Requirements:
    - Aggregate from immediate children (files + subdirs)
    - Recursive aggregation
  - Test: Calculate for root directory
  
- [ ] **2.3** Implement repository metrics
  - File: `git-service/app/core/metrics/calculator.py`
  - Function: `calculate_repo_metrics(...) -> Dict`
  - Requirements: Same as directory metrics on root
  - Test: Compare with directory metrics for root
  
- [ ] **2.4** Implement commit set metrics
  - File: `git-service/app/core/metrics/calculator.py`
  - Function: `calculate_commit_set_metrics(commit_set, ...) -> Dict`
  - Metrics: modifications, modification_frequency, churn_rate
  - Test: Calculate for time period
  
- [ ] **2.5** Implement author metrics
  - File: `git-service/app/core/metrics/calculator.py`
  - Function: `calculate_author_metrics(author, ...) -> Dict`
  - Metrics: modifications, churn, ownership
  - Test: Calculate for known author

### Testing Strategy
```python
# Test against known values from cJSON repo
def test_file_metrics_cjson():
    """Test file metrics against manually calculated values"""
    metrics = calculate_file_metrics(
        repo_path="/path/to/cjson",
        file_path="cJSON.c",
        commit_hashes=["abc123"]  # Specific commit
    )
    assert metrics["added_lines"] == 42  # Known value
    assert metrics["removed_lines"] == 10
    assert metrics["growth"] == 32
    assert metrics["churn"] == 52

def test_directory_metrics_aggregation():
    """Test that directory metrics correctly aggregate children"""
    dir_metrics = calculate_directory_metrics(
        repo_path="/path/to/cjson",
        dir_path="."
    )
    # Sum of all file metrics should equal directory metrics
    file_metrics_sum = sum_all_file_metrics()
    assert dir_metrics["added_lines"] == file_metrics_sum["added_lines"]

def test_author_ownership():
    """Test author ownership calculation"""
    author_metrics = calculate_author_metrics(
        repo_path="/path/to/cjson",
        author="Dave Gamble"
    )
    # Ownership should be between 0 and 1
    assert 0 <= author_metrics["ownership"] <= 1
    # Sum of all author ownerships should equal 1
    all_authors = get_all_authors()
    total_ownership = sum(a["ownership"] for a in all_authors)
    assert abs(total_ownership - 1.0) < 0.01
```

### Validation Tests
Create reference data from test repos:
```bash
# Generate reference metrics for cJSON at specific commit
python scripts/generate_reference_metrics.py \
  --repo https://github.com/DaveGamble/cJSON.git \
  --commit abc123 \
  --output tests/reference/cjson_metrics.json
```

### Checkpoint
✅ File metrics calculated correctly  
✅ Directory metrics aggregate properly  
✅ Repository metrics work  
✅ Commit set metrics support time filtering  
✅ Author metrics and ownership calculated  
✅ All metrics validated against test repos  

---

## Phase 3: Database & Storage (20 minutes)

### Tasks
- [ ] **3.1** Implement repository storage
  - File: `backend/src/services/repo.service.ts`
  - Functions:
    - `saveRepository(repo: Repository) -> void`
    - `getRepository(id: string) -> Repository`
    - `listRepositories() -> Repository[]`
  - Test: Save and retrieve repository
  
- [ ] **3.2** Implement metric storage
  - File: `backend/src/services/metric.service.ts`
  - Functions:
    - `saveMetrics(repoId, metrics) -> void`
    - `getMetrics(repoId, filters) -> Metrics`
  - Test: Store and retrieve metrics
  
- [ ] **3.3** Implement author merging
  - File: `backend/src/services/author.service.ts`
  - Functions:
    - `mergeAuthors(authorIds: string[], targetId: string) -> void`
    - `parseMailmap(repoPath: string) -> Map<string, string>`
  - Test: Merge authors and verify metrics update

### Testing
```typescript
// backend/tests/services/repo.service.test.ts
describe('Repository Service', () => {
  test('should save and retrieve repository', () => {
    const repo = { id: 'test', name: 'Test Repo', path: '/tmp/test' };
    saveRepository(repo);
    const retrieved = getRepository('test');
    expect(retrieved).toEqual(repo);
  });

  test('should list all repositories', () => {
    saveRepository({ id: '1', name: 'Repo 1', path: '/tmp/1' });
    saveRepository({ id: '2', name: 'Repo 2', path: '/tmp/2' });
    const repos = listRepositories();
    expect(repos.length).toBe(2);
  });
});

describe('Author Merging', () => {
  test('should merge authors', () => {
    // Create two authors
    saveAuthor({ id: '1', name: 'John', email: 'john@example.com' });
    saveAuthor({ id: '2', name: 'John D', email: 'john.d@example.com' });
    
    // Merge them
    mergeAuthors(['1', '2'], '1');
    
    // Verify metrics are combined
    const metrics = getAuthorMetrics('1');
    expect(metrics.commit_count).toBe(10); // Combined count
  });
});
```

### Checkpoint
✅ Can save/retrieve repositories  
✅ Can store/retrieve metrics  
✅ Author merging works  
✅ Mailmap parsing works  

---

## Phase 4: API Integration (25 minutes)

### Tasks
- [ ] **4.1** Implement upload endpoints
  - File: `backend/src/routes/upload.routes.ts`
  - Endpoints:
    - `POST /api/upload/zip` - Handle zip upload
    - `POST /api/upload/clone` - Handle URL clone
  - Requirements:
    - Save file to disk
    - Trigger git processing
    - Store in database
  - Test: Upload and verify storage
  
- [ ] **4.2** Implement repository endpoints
  - File: `backend/src/routes/repo.routes.ts`
  - Endpoints:
    - `GET /api/repos` - List repos
    - `GET /api/repos/:id` - Get repo
    - `DELETE /api/repos/:id` - Delete repo
  - Test: CRUD operations
  
- [ ] **4.3** Implement metric endpoints
  - File: `backend/src/routes/metrics.routes.ts`
  - Endpoints:
    - `GET /api/metrics/repo/:id` - Get repo metrics
    - `GET /api/metrics/file/:repoId/:path` - Get file metrics
    - `GET /api/metrics/directory/:repoId/:path` - Get dir metrics
    - `GET /api/metrics/author/:repoId/:author` - Get author metrics
  - Requirements:
    - Proxy to git-service
    - Apply filters (time, commits)
    - Return formatted data
  - Test: Fetch metrics via API

### Testing
```typescript
// backend/tests/routes/upload.test.ts
import request from 'supertest';
import app from '../../src/server';

describe('POST /api/upload/clone', () => {
  test('should clone repository from URL', async () => {
    const response = await request(app)
      .post('/api/upload/clone')
      .send({ url: 'https://github.com/DaveGamble/cJSON.git' });
    
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('cloned');
    
    // Verify repository was saved
    const repos = await request(app).get('/api/repos');
    expect(repos.body.repos.length).toBeGreaterThan(0);
  });
});

describe('GET /api/metrics/repo/:id', () => {
  test('should return repository metrics', async () => {
    // First clone a repo
    await cloneTestRepo();
    
    const response = await request(app)
      .get('/api/metrics/repo/test-repo');
    
    expect(response.status).toBe(200);
    expect(response.body.metrics).toHaveProperty('commit_count');
    expect(response.body.metrics).toHaveProperty('added_lines');
    expect(response.body.metrics).toHaveProperty('churn');
  });

  test('should support time filtering', async () => {
    const response = await request(app)
      .get('/api/metrics/repo/test-repo')
      .query({ 
        start_time: 1609459200, // 2021-01-01
        end_time: 1640995200    // 2022-01-01
      });
    
    expect(response.status).toBe(200);
    // Metrics should only include commits in time range
  });
});
```

### Checkpoint
✅ Can upload ZIP files via API  
✅ Can clone repos via API  
✅ Can list/get/delete repos  
✅ Can fetch all metric types via API  
✅ Filtering works (time, commits)  

---

## Phase 5: Frontend UI (30 minutes)

### Tasks
- [ ] **5.1** Implement upload page
  - File: `frontend/src/pages/UploadRepo.tsx`
  - Features:
    - URL input with validation
    - File upload with drag-drop
    - Progress indicator
    - Error handling
  - Test: Upload and verify redirect
  
- [ ] **5.2** Implement dashboard
  - File: `frontend/src/pages/Dashboard.tsx`
  - Features:
    - Repository list
    - Delete button
    - Link to detail view
  - Test: Display repos, navigate to detail
  
- [ ] **5.3** Implement repository view
  - File: `frontend/src/pages/RepositoryView.tsx`
  - Features:
    - Display metrics cards
    - Add charts (Recharts)
    - Filter controls
  - Test: Display metrics, apply filters
  
- [ ] **5.4** Add filtering UI
  - File: `frontend/src/components/Filters.tsx`
  - Features:
    - Time range picker
    - Author selector
    - File/directory browser
  - Test: Filters update metrics

### Testing
```typescript
// frontend/src/__tests__/UploadRepo.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import UploadRepo from '../pages/UploadRepo';

describe('UploadRepo', () => {
  test('should render upload form', () => {
    render(<UploadRepo />);
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
    expect(screen.getByText('Clone Repository')).toBeInTheDocument();
  });

  test('should submit URL', async () => {
    render(<UploadRepo />);
    const input = screen.getByPlaceholderText('https://...');
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(screen.getByText('Clone Repository'));
    
    // Wait for navigation
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });
});

// frontend/src/__tests__/Dashboard.test.tsx
describe('Dashboard', () => {
  test('should display repository list', async () => {
    render(<Dashboard />);
    
    // Wait for data to load
    const repoLink = await screen.findByText('Test Repo');
    expect(repoLink).toBeInTheDocument();
  });

  test('should navigate to repo detail', async () => {
    render(<Dashboard />);
    const repoLink = await screen.findByText('Test Repo');
    fireEvent.click(repoLink);
    
    expect(window.location.pathname).toBe('/repo/test-repo');
  });
});
```

### Checkpoint
✅ Can upload repos via UI  
✅ Dashboard displays repo list  
✅ Repository view shows metrics  
✅ Filters work in UI  

---

## Phase 6: Advanced Features (25 minutes)

### Tasks
- [ ] **6.1** Implement author merging UI
  - File: `frontend/src/pages/AuthorMerge.tsx`
  - Features:
    - List all authors
    - Select authors to merge
    - Confirm merge
  - Test: Merge authors via UI
  
- [ ] **6.2** Implement file/directory browser
  - File: `frontend/src/components/FileBrowser.tsx`
  - Features:
    - Tree view of files
    - Click to view metrics
    - Breadcrumb navigation
  - Test: Navigate file tree
  
- [ ] **6.3** Add visualizations
  - File: `frontend/src/components/Charts.tsx`
  - Charts:
    - Line chart: commits over time
    - Bar chart: top contributors
    - Pie chart: file type distribution
  - Test: Charts render with data
  
- [ ] **6.4** Implement mailmap support
  - File: `git-service/app/core/git/mailmap.py`
  - Function: `parse_mailmap(repo_path) -> Dict[str, str]`
  - Test: Parse .mailmap file

### Testing
```python
# git-service/tests/test_mailmap.py
def test_parse_mailmap():
    """Test .mailmap parsing"""
    mailmap = parse_mailmap("/path/to/repo")
    assert "old@email.com" in mailmap
    assert mailmap["old@email.com"] == "new@email.com"

def test_author_merge_with_mailmap():
    """Test that mailmap is applied during metric calculation"""
    metrics = calculate_author_metrics(
        repo_path="/path/to/repo",
        author="John Doe"
    )
    # Should include commits from all merged emails
    assert metrics["commit_count"] > 0
```

### Checkpoint
✅ Author merging works via UI  
✅ File browser navigates tree  
✅ Charts display correctly  
✅ Mailmap support implemented  

---

## Phase 7: Performance & Optimization (15 minutes)

### Tasks
- [ ] **7.1** Add metric caching
  - File: `backend/src/services/cache.service.ts`
  - Strategy: Cache computed metrics in database
  - Test: Verify cache hits/misses
  
- [ ] **7.2** Implement batch processing
  - File: `git-service/app/core/metrics/calculator.py`
  - Strategy: Process commits in batches of 1000
  - Test: Process large repo without memory issues
  
- [ ] **7.3** Add progress indicators
  - File: `backend/src/services/progress.service.ts`
  - Features:
    - WebSocket for real-time updates
    - Progress percentage
    - Current operation
  - Test: Progress updates during clone

### Testing
```typescript
// Performance test
describe('Large Repository Performance', () => {
  test('should handle 100k commits', async () => {
    const startTime = Date.now();
    
    const metrics = await calculateRepoMetrics('/path/to/large-repo');
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(60000); // Under 1 minute
    expect(metrics.commit_count).toBeGreaterThan(100000);
  });

  test('should not exceed memory limit', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    await calculateRepoMetrics('/path/to/large-repo');
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should not increase by more than 500MB
    expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024);
  });
});
```

### Checkpoint
✅ Metrics cached in database  
✅ Can process 100k commits  
✅ Memory usage reasonable  
✅ Progress indicators work  

---

## Testing Fundamentals

### Test Pyramid
```
        /\
       /  \
      / E2E\        <- 10% (Critical workflows)
     /______\
    /        \
   / Integr.  \    <- 30% (API + DB)
  /____________\
 /              \
/    Unit Tests  \  <- 60% (Functions, methods)
/________________\
```

### What to Test

**Unit Tests (60%)**
- Metric calculation functions
- Git operations
- Database queries
- Utility functions

**Integration Tests (30%)**
- API endpoints with database
- Git service integration
- File upload flow
- Author merging flow

**E2E Tests (10%)**
- Complete upload → analyze → view workflow
- Filter application
- Multi-repository management

### Test Data

**Reference Repositories:**
1. **cJSON** (small, ~500 commits) - Quick validation
2. **Redis** (medium, ~10k commits) - Performance testing
3. **Git** (large, ~60k commits) - Stress testing

**Reference Metrics:**
Generate known-good metrics for specific commits:
```bash
python scripts/generate_reference.py \
  --repo cJSON \
  --commit abc123 \
  --output tests/reference/cjson_abc123.json
```

### Test Commands

```bash
# Run all tests
npm test                    # Backend
pytest                      # Git Service
npm test --prefix frontend  # Frontend

# Run specific test file
npm test -- repo.service.test.ts
pytest tests/test_metrics.py
npm test -- Dashboard.test.tsx

# Run with coverage
npm run test:coverage
pytest --cov=app
npm run test:coverage --prefix frontend

# Run E2E tests
npm run test:e2e
```

### Continuous Testing

**Pre-commit Hooks:**
```bash
# .husky/pre-commit
npm test
pytest
npm test --prefix frontend
```

**CI Pipeline:**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../git-service && pytest
          cd ../frontend && npm test
```

---

## Time Allocation Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0. Foundation & Testing | 15 min | 15 min |
| 1. Git Operations | 30 min | 45 min |
| 2. Metric Calculations | 45 min | 1h 30m |
| 3. Database & Storage | 20 min | 1h 50m |
| 4. API Integration | 25 min | 2h 15m |
| 5. Frontend UI | 30 min | 2h 45m |
| 6. Advanced Features | 25 min | 3h 10m |
| 7. Performance | 15 min | 3h 25m |
| **Buffer** | **35 min** | **4h 00m** |

**Note:** The test is 2.5 hours, but this blueprint assumes some overtime. Prioritize Phases 0-5 for core functionality (2h 45m). Phases 6-7 are for extra marks.

---

## Priority Matrix

### Must Have (Core - 50% of marks)
- ✅ Repository upload (URL + ZIP)
- ✅ File metrics
- ✅ Directory metrics
- ✅ Repository metrics
- ✅ Commit set metrics
- ✅ Author metrics
- ✅ Multiple repository support
- ✅ Basic filtering

### Should Have (Architecture - 25% of marks)
- ✅ Efficient algorithms
- ✅ Good visualization
- ✅ Clean code structure
- ✅ Proper error handling

### Nice to Have (Usability - 25% of marks)
- ✅ Author merging UI
- ✅ File browser
- ✅ Advanced charts
- ✅ Progress indicators
- ✅ Performance optimization

---

## Risk Mitigation

**Risk 1: Git operations too slow**
- **Mitigation:** Use pygit2 (C bindings), batch processing, caching

**Risk 2: Metric calculations incorrect**
- **Mitigation:** Extensive unit tests, validate against reference data

**Risk 3: Memory issues with large repos**
- **Mitigation:** Stream processing, batch commits, limit in-memory data

**Risk 4: Time management**
- **Mitigation:** Focus on core features first, skip advanced features if behind

---

## Success Criteria

**Minimum Viable Product (Pass):**
- Can upload repos via URL and ZIP
- Displays basic metrics (commits, lines added/removed)
- Works for small repos (<1000 commits)

**Good Product (Credit):**
- All metric categories implemented
- Filtering works
- Author merging works
- Good UI/UX

**Excellent Product (Distinction):**
- Efficient performance on large repos
- Advanced visualizations
- Clean, well-tested code
- All features working

---

## Next Actions

1. **Start with Phase 0** - Set up testing infrastructure
2. **Move to Phase 1** - Get git operations working
3. **Test thoroughly** - Don't move forward with broken code
4. **Track progress** - Check off tasks as you complete them
5. **Time box** - Don't spend too long on any one phase

**Remember:** Working code > Perfect code. Get it working first, then optimize.
