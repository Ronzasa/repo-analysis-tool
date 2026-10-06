import Database from 'better-sqlite3';
import { config } from './config';
import fs from 'fs';
import path from 'path';

let instance: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (instance) {
    return instance;
  }

  // Ensure data directory exists
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  instance = new Database(config.dbPath);

  // Create tables
  instance.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      url TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      merged_into TEXT,
      FOREIGN KEY (merged_into) REFERENCES authors(id)
    );

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
    );

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
    );

    CREATE INDEX IF NOT EXISTS idx_file_metrics_repo ON file_metrics(repo_id);
    CREATE INDEX IF NOT EXISTS idx_file_metrics_commit ON file_metrics(commit_hash);
    CREATE INDEX IF NOT EXISTS idx_directory_metrics_repo ON directory_metrics(repo_id);
  `);

  return instance;
}

export class Database {
  private static instance: Database.Database;

  static getInstance(): Database.Database {
    if (!Database.instance) {
      Database.instance = initDatabase();
    }
    return Database.instance;
  }
}
