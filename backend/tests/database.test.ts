import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'jest';
import { setup, teardown, clearData, getTestDb } from './helpers';
import { Database as SqlJsDatabase } from 'sql.js';

describe('Database Setup', () => {
  let db: SqlJsDatabase | null;

  beforeAll(async () => {
    db = await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    await clearData();
  });

  it('should create repositories table', () => {
    const result = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='repositories'");
    expect(result.length).toBeGreaterThan(0);
  });

  it('should create authors table', () => {
    const result = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='authors'");
    expect(result.length).toBeGreaterThan(0);
  });

  it('should create file_metrics table', () => {
    const result = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='file_metrics'");
    expect(result.length).toBeGreaterThan(0);
  });

  it('should create directory_metrics table', () => {
    const result = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='directory_metrics'");
    expect(result.length).toBeGreaterThan(0);
  });

  it('should insert and retrieve repository', () => {
    const repo = {
      id: 'test-repo',
      name: 'Test Repository',
      path: '/tmp/test',
      url: 'https://github.com/test/repo.git'
    };

    db!.run('INSERT INTO repositories (id, name, path, url) VALUES (?, ?, ?, ?)', [
      repo.id, repo.name, repo.path, repo.url
    ]);

    const stmt = db!.prepare('SELECT * FROM repositories WHERE id = ?');
    stmt.bind([repo.id]);
    
    let retrieved: any = null;
    if (stmt.step()) {
      retrieved = stmt.getAsObject();
    }
    stmt.free();

    expect(retrieved).toMatchObject(repo);
  });
});
