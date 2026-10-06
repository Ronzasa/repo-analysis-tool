# Task Tracker

Use this to track your progress through the blueprint. Mark tasks with [x] when complete.

## Phase 0: Foundation & Testing Setup (15 min)
- [ ] 0.1 Initialize git repo and commit structure
- [ ] 0.2 Set up testing frameworks (Jest, pytest, Vitest)
- [ ] 0.3 Create test directory structure
- [ ] 0.4 Set up test database
- [ ] 0.5 Create test utilities

**Checkpoint:** ✅ Testing frameworks working

---

## Phase 1: Git Operations Core (30 min)
- [ ] 1.1 Implement repository cloning
- [ ] 1.2 Implement ZIP extraction
- [ ] 1.3 Implement commit iteration (skip merges)
- [ ] 1.4 Implement diff parsing (rename detection, binary exclusion)

**Checkpoint:** ✅ Can clone, iterate commits, parse diffs

---

## Phase 2: Metric Calculations (45 min)
- [ ] 2.1 File metrics (added, removed, growth, churn)
- [ ] 2.2 Directory metrics (aggregate from children)
- [ ] 2.3 Repository metrics (root level)
- [ ] 2.4 Commit set metrics (time-based)
- [ ] 2.5 Author metrics (modifications, churn, ownership)

**Checkpoint:** ✅ All metrics calculated correctly

---

## Phase 3: Database & Storage (20 min)
- [ ] 3.1 Repository storage (save, get, list)
- [ ] 3.2 Metric storage (save, get with filters)
- [ ] 3.3 Author merging (manual + mailmap)

**Checkpoint:** ✅ Data persists correctly

---

## Phase 4: API Integration (25 min)
- [ ] 4.1 Upload endpoints (zip + clone)
- [ ] 4.2 Repository endpoints (list, get, delete)
- [ ] 4.3 Metric endpoints (all types with filters)

**Checkpoint:** ✅ API fully functional

---

## Phase 5: Frontend UI (30 min)
- [ ] 5.1 Upload page (URL + file)
- [ ] 5.2 Dashboard (repo list)
- [ ] 5.3 Repository view (metrics display)
- [ ] 5.4 Filtering UI (time, author, file)

**Checkpoint:** ✅ UI complete and functional

---

## Phase 6: Advanced Features (25 min)
- [ ] 6.1 Author merging UI
- [ ] 6.2 File/directory browser
- [ ] 6.3 Visualizations (charts)
- [ ] 6.4 Mailmap support

**Checkpoint:** ✅ Advanced features working

---

## Phase 7: Performance (15 min)
- [ ] 7.1 Metric caching
- [ ] 7.2 Batch processing
- [ ] 7.3 Progress indicators

**Checkpoint:** ✅ Handles large repos efficiently

---

## Testing Progress

### Unit Tests
- [ ] Git operations tests
- [ ] Metric calculation tests
- [ ] Database service tests
- [ ] Utility function tests

### Integration Tests
- [ ] API endpoint tests
- [ ] Upload flow tests
- [ ] Metric retrieval tests

### Validation Tests
- [ ] cJSON reference metrics
- [ ] Redis reference metrics
- [ ] Git repo reference metrics

### Performance Tests
- [ ] Small repo (<1k commits)
- [ ] Medium repo (~10k commits)
- [ ] Large repo (~60k commits)

---

## Current Status

**Phase:** [Current phase number]
**Tasks Completed:** [X/34]
**Tests Passing:** [X/Y]
**Time Elapsed:** [X hours]
**Time Remaining:** [X hours]

---

## Notes

_Add any notes, issues, or decisions here_

---

## Blockers

_List any blockers and how you plan to resolve them_

1. [Blocker description] → [Resolution plan]

---

## Quick Commands

```bash
# Start services
./start.sh

# Run tests
npm test                              # Backend
pytest                                # Git Service  
npm test --prefix frontend            # Frontend

# Check logs
docker-compose logs -f backend
docker-compose logs -f git-service

# Reset database
rm data/rat.db && docker-compose restart
```
