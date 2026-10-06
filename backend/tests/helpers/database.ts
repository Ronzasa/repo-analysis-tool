import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../../test_rat.db');

export async function setupTestDatabase(): Promise<SqlJsDatabase> {
  // Remove existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      url TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      merged_into TEXT,
      FOREIGN KEY (merged_into) REFERENCES authors(id)
    )
  `);

  db.run(`
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

  db.run(`
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

  return db;
}

export function teardownTestDatabase(db: SqlJsDatabase) {
  db.close();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

export function clearTestData(db: SqlJsDatabase) {
  db.run('DELETE FROM file_metrics');
  db.run('DELETE FROM directory_metrics');
  db.run('DELETE FROM authors');
  db.run('DELETE FROM repositories');
}
