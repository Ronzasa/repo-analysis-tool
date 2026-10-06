# Database Migration: better-sqlite3 → sql.js

## ✅ Migration Complete

Successfully migrated from `better-sqlite3` to `sql.js` to resolve native compilation issues.

---

## Why the Migration?

### Problem with better-sqlite3:
- Requires native C++ compilation via node-gyp
- Conflicted with Anaconda Python's gyp configuration
- Build failed with: `importlib.metadata.PackageNotFoundError: No package metadata was found for gyp`

### Solution - sql.js:
- ✅ Pure JavaScript implementation of SQLite
- ✅ No native compilation needed
- ✅ Works in all Node.js environments
- ✅ Easier to deploy and maintain

---

## Files Updated

### 1. `backend/package.json`
**Changed:**
- Removed: `"better-sqlite3": "^9.4.3"`
- Added: `"sql.js": "^1.9.0"`
- Removed: `"@types/better-sqlite3": "^7.6.8"` (from devDependencies)

### 2. `backend/src/database.ts`
**Major Changes:**
- Switched to async initialization: `async initDatabase(): Promise<SqlJsDatabase>`
- Added manual database file saving: `saveDatabase()`
- Added helper functions:
  - `getDatabase()` - Get database instance
  - `closeDatabase()` - Close and save database
  - `runQuery(sql, params)` - Execute SQL with auto-save
  - `getAllRows(sql, params)` - Get all rows as array
  - `getOneRow(sql, params)` - Get single row

**Key API Differences:**
```typescript
// better-sqlite3 (synchronous)
const db = new Database('path.db');
db.exec('CREATE TABLE ...');
const rows = db.prepare('SELECT *').all();

// sql.js (asynchronous)
const SQL = await initSqlJs();
const db = new SQL.Database();
db.run('CREATE TABLE ...');
const stmt = db.prepare('SELECT *');
while (stmt.step()) {
  const row = stmt.getAsObject();
}
```

### 3. `backend/src/server.ts`
**Changes:**
- Added async database initialization on startup
- Added graceful shutdown with `closeDatabase()`
- Database is now initialized before server starts

### 4. `backend/src/routes/repo.routes.ts`
**Changes:**
- Replaced `Database.getInstance()` with helper functions
- Updated to use `getAllRows()`, `getOneRow()`, `runQuery()`
- Simplified database operations

### 5. `backend/tests/helpers/database.ts`
**Changes:**
- Updated to use sql.js async API
- Changed `setupTestDatabase()` to async
- Updated table creation to use `db.run()` instead of `db.exec()`

### 6. `backend/tests/helpers/index.ts`
**Changes:**
- Updated imports to use sql.js types
- Made `setup()` async
- Added null check for testDb

### 7. `backend/tests/database.test.ts`
**Changes:**
- Updated to use sql.js API
- Changed from `db.prepare().all()` to `db.exec()`
- Updated row retrieval to use `stmt.step()` and `stmt.getAsObject()`

---

## New Helper Functions

The new database module provides convenient helper functions:

### `runQuery(sql: string, params: any[]): void`
Execute SQL and auto-save database.
```typescript
runQuery('INSERT INTO repositories (id, name) VALUES (?, ?)', ['id1', 'Repo 1']);
```

### `getAllRows(sql: string, params: any[]): any[]`
Get all rows as an array of objects.
```typescript
const repos = getAllRows('SELECT * FROM repositories WHERE name = ?', ['Repo 1']);
```

### `getOneRow(sql: string, params: any[]): any | null`
Get a single row or null.
```typescript
const repo = getOneRow('SELECT * FROM repositories WHERE id = ?', ['id1']);
```

### `getDatabase(): SqlJsDatabase`
Get the raw database instance for complex queries.
```typescript
const db = getDatabase();
const stmt = db.prepare('SELECT * FROM repositories');
while (stmt.step()) {
  console.log(stmt.getAsObject());
}
stmt.free();
```

---

## Important Notes

### 1. Async Initialization
Database must be initialized asynchronously before use:
```typescript
await initDatabase();
```

### 2. Manual Saving
Unlike better-sqlite3, sql.js doesn't auto-save. The helper functions handle this automatically, but if you use `getDatabase()` directly, remember to call `saveDatabase()`.

### 3. Statement Cleanup
When using `prepare()`, always call `stmt.free()` when done to avoid memory leaks.

### 4. Database File
The database is saved to `config.dbPath` (default: `./data/rat.db`).

---

## Testing

Run the database tests to verify the migration:
```bash
cd backend
npm test
```

Expected output:
```
PASS  tests/database.test.ts
  Database Setup
    ✓ should create repositories table
    ✓ should create authors table
    ✓ should create file_metrics table
    ✓ should create directory_metrics table
    ✓ should insert and retrieve repository
```

---

## Benefits of Migration

### ✅ No Build Issues
- Works with Anaconda Python
- No native compilation needed
- Installs cleanly on all platforms

### ✅ Easier Deployment
- Pure JavaScript - no platform-specific binaries
- Smaller deployment package
- Works in restricted environments

### ✅ Same Functionality
- All SQLite features still available
- Same SQL syntax
- Same database schema

### ⚠️ Performance Consideration
- sql.js is slightly slower than better-sqlite3 for large datasets
- For this project's scale, performance difference is negligible
- Can optimize later if needed

---

## Next Steps

Database migration is complete. All backend code has been updated to use sql.js.

**Ready to proceed with Phase 1: Git Operations Core**

---

## Rollback Plan (If Needed)

If you need to rollback to better-sqlite3:

1. Install build tools:
   ```bash
   sudo apt-get install build-essential python3
   ```

2. Update package.json:
   ```json
   "dependencies": {
     "better-sqlite3": "^9.4.3"
   }
   ```

3. Revert database.ts using git:
   ```bash
   git checkout HEAD -- backend/src/database.ts
   ```

4. Reinstall:
   ```bash
   cd backend
   npm install
   ```

---

**Migration Status: ✅ COMPLETE**
