import { saveAuthor, getAuthor, getAuthorByEmail, listAuthors, mergeAuthors, listMergedAuthors, deleteAuthor } from '../src/services/author.service';
import { initDatabase, closeDatabase, runQuery } from '../src/database';

describe('Author Service', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // Clear all authors before each test
    runQuery('DELETE FROM authors');
  });

  describe('saveAuthor', () => {
    it('should save a new author', () => {
      saveAuthor({
        id: 'author1',
        name: 'John Doe',
        email: 'john@example.com'
      });

      const author = getAuthor('author1');
      
      expect(author).not.toBeNull();
      expect(author?.name).toBe('John Doe');
      expect(author?.email).toBe('john@example.com');
    });

    it('should update existing author on conflict', () => {
      saveAuthor({
        id: 'author1',
        name: 'John Doe',
        email: 'john@example.com'
      });

      saveAuthor({
        id: 'author1',
        name: 'John Updated',
        email: 'john.updated@example.com'
      });

      const author = getAuthor('author1');
      
      expect(author?.name).toBe('John Updated');
      expect(author?.email).toBe('john.updated@example.com');
    });
  });

  describe('getAuthor', () => {
    it('should get an author by ID', () => {
      saveAuthor({
        id: 'author1',
        name: 'John Doe',
        email: 'john@example.com'
      });

      const author = getAuthor('author1');
      
      expect(author).not.toBeNull();
      expect(author?.id).toBe('author1');
    });

    it('should return null for non-existent ID', () => {
      const author = getAuthor('non-existent-id');
      expect(author).toBeNull();
    });
  });

  describe('getAuthorByEmail', () => {
    it('should get an author by email', () => {
      saveAuthor({
        id: 'author1',
        name: 'John Doe',
        email: 'john@example.com'
      });

      const author = getAuthorByEmail('john@example.com');
      
      expect(author).not.toBeNull();
      expect(author?.name).toBe('John Doe');
    });

    it('should return null for non-existent email', () => {
      const author = getAuthorByEmail('nonexistent@example.com');
      expect(author).toBeNull();
    });
  });

  describe('listAuthors', () => {
    it('should list all authors', () => {
      saveAuthor({ id: 'author1', name: 'Alice', email: 'alice@example.com' });
      saveAuthor({ id: 'author2', name: 'Bob', email: 'bob@example.com' });
      saveAuthor({ id: 'author3', name: 'Charlie', email: 'charlie@example.com' });

      const authors = listAuthors();
      
      expect(authors).toHaveLength(3);
      expect(authors[0].name).toBe('Alice');
      expect(authors[1].name).toBe('Bob');
      expect(authors[2].name).toBe('Charlie');
    });

    it('should return empty array when no authors', () => {
      const authors = listAuthors();
      expect(authors).toEqual([]);
    });

    it('should order authors by name', () => {
      saveAuthor({ id: 'author1', name: 'Zack', email: 'zack@example.com' });
      saveAuthor({ id: 'author2', name: 'Alice', email: 'alice@example.com' });
      saveAuthor({ id: 'author3', name: 'Mike', email: 'mike@example.com' });

      const authors = listAuthors();
      
      expect(authors[0].name).toBe('Alice');
      expect(authors[1].name).toBe('Mike');
      expect(authors[2].name).toBe('Zack');
    });
  });

  describe('mergeAuthors', () => {
    it('should merge authors correctly', () => {
      saveAuthor({ id: 'author1', name: 'John Doe', email: 'john@example.com' });
      saveAuthor({ id: 'author2', name: 'J. Doe', email: 'j.doe@example.com' });
      saveAuthor({ id: 'author3', name: 'John D.', email: 'jd@example.com' });

      mergeAuthors(['author2', 'author3'], 'author1');

      const author1 = getAuthor('author1');
      const author2 = getAuthor('author2');
      const author3 = getAuthor('author3');

      expect(author1?.merged_into).toBeNull();
      expect(author2?.merged_into).toBe('author1');
      expect(author3?.merged_into).toBe('author1');
    });

    it('should handle single author merge', () => {
      saveAuthor({ id: 'author1', name: 'John Doe', email: 'john@example.com' });
      saveAuthor({ id: 'author2', name: 'J. Doe', email: 'j.doe@example.com' });

      mergeAuthors(['author2'], 'author1');

      const author2 = getAuthor('author2');
      expect(author2?.merged_into).toBe('author1');
    });
  });

  describe('listMergedAuthors', () => {
    it('should get merged author relationships', () => {
      saveAuthor({ id: 'author1', name: 'John Doe', email: 'john@example.com' });
      saveAuthor({ id: 'author2', name: 'J. Doe', email: 'j.doe@example.com' });
      saveAuthor({ id: 'author3', name: 'John D.', email: 'jd@example.com' });

      mergeAuthors(['author2', 'author3'], 'author1');

      const merged = listMergedAuthors();

      expect(merged).toHaveLength(2);
      expect(merged[0].merged_into).toBe('author1');
      expect(merged[1].merged_into).toBe('author1');
    });

    it('should return empty array when no merges', () => {
      saveAuthor({ id: 'author1', name: 'John Doe', email: 'john@example.com' });
      saveAuthor({ id: 'author2', name: 'Jane Doe', email: 'jane@example.com' });

      const merged = listMergedAuthors();
      expect(merged).toEqual([]);
    });
  });

  describe('deleteAuthor', () => {
    it('should delete an author', () => {
      saveAuthor({
        id: 'author1',
        name: 'John Doe',
        email: 'john@example.com'
      });

      deleteAuthor('author1');

      const author = getAuthor('author1');
      expect(author).toBeNull();
    });
  });
});
