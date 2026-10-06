import { setupTestDatabase, teardownTestDatabase, clearTestData } from './database';
import { Database as SqlJsDatabase } from 'sql.js';

let testDb: SqlJsDatabase | null = null;

export async function setup() {
  testDb = await setupTestDatabase();
  return testDb;
}

export async function teardown() {
  if (testDb) {
    teardownTestDatabase(testDb);
    testDb = null;
  }
}

export async function clearData() {
  if (testDb) {
    clearTestData(testDb);
  }
}

export function getTestDb() {
  return testDb;
}
