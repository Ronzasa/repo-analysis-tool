import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { config } from './config';
import fs from 'fs';
import path from 'path';

let instance: SqlJsDatabase | null = null;
let dbInitialized = false;

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (instance && dbInitialized) {
    return instance;
  }

  // Ensure data directory exists
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(config.dbPath)) {
    const buffer = fs.readFileSync(config.dbPath);
    instance = new SQL.Database(buffer);
  } else {
    instance = new SQL.Database();
  }

  // Create tables
  instance.run(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      url TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  instance.run(`
    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      merged_into TEXT,
      FOREIGN KEY (merged_into) REFERENCES authors(id)
    )
  `);

  instance.run(`
    CREATE TABLE IF NOT EXISTS file_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      commit_hash TEXT NOT NULL,
      author_id TEXT,
      added_lines INTEGER DEFAULT 0,
      removed_lines INTEGER DEFAULT 0,
      growth INTEGER DEFAULT 0,
      churn INTEGER DEFAULT 0,
      FOREIGN KEY (repo_id) REFERENCES repositories(id),
      FOREIGN KEY (author_id) REFERENCES authors(id)
    )
  `);

  instance.run(`
    CREATE TABLE IF NOT EXISTS directory_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id TEXT NOT NULL,
      dir_path TEXT NOT NULL,
      commit_hash TEXT NOT NULL,
      author_id TEXT,
      added_lines INTEGER DEFAULT 0,
      removed_lines INTEGER DEFAULT 0,
      growth INTEGER DEFAULT 0,
      churn INTEGER DEFAULT 0,
      FOREIGN KEY (repo_id) REFERENCES repositories(id),
      FOREIGN KEY (author_id) REFERENCES authors(id)
    )
  `);

  instance.run(`CREATE INDEX IF NOT EXISTS idx_file_metrics_repo ON file_metrics(repo_id)`);
  instance.run(`CREATE INDEX IF NOT EXISTS idx_file_metrics_commit ON file_metrics(commit_hash)`);
  instance.run(`CREATE INDEX IF NOT EXISTS idx_directory_metrics_repo ON directory_metrics(repo_id)`);

  // Save database to file
  saveDatabase();

  dbInitialized = true;
  return instance;
}

export function saveDatabase(): void {
  if (!instance) {
    throw new Error('Database not initialized');
  }

  const data = instance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
}

export function getDatabase(): SqlJsDatabase {
  if (!instance || !dbInitialized) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return instance;
}

export function closeDatabase(): void {
  if (instance) {
    saveDatabase();
    instance.close();
    instance = null;
    dbInitialized = false;
  }
}

// Helper functions for common operations
export function runQuery(sql: string, params: any[] = []): void {
  const db = getDatabase();
  db.run(sql, params);
  saveDatabase();
}

export function getAllRows(sql: string, params: any[] = []): any[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function getOneRow(sql: string, params: any[] = []): any | null {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  
  let row: any = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}
