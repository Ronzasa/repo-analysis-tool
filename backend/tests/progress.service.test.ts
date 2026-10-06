import { createProgressTracker, updateProgress, getProgress, getAllProgress, deleteProgress, trackProgress } from '../src/services/progress.service';

describe('Progress Service', () => {
  describe('createProgressTracker', () => {
    it('should create a new progress tracker', () => {
      const id = createProgressTracker('Test Operation');
      expect(id).toBeTruthy();
      
      const tracker = getProgress(id);
      expect(tracker).not.toBeNull();
      expect(tracker?.operation).toBe('Test Operation');
      expect(tracker?.progress).toBe(0);
      expect(tracker?.status).toBe('pending');
    });

    it('should create tracker with total steps', () => {
      const id = createProgressTracker('Test Operation', 100);
      const tracker = getProgress(id);
      expect(tracker?.totalSteps).toBe(100);
    });
  });

  describe('updateProgress', () => {
    it('should update progress percentage', () => {
      const id = createProgressTracker('Test');
      updateProgress(id, { progress: 50 });
      
      const tracker = getProgress(id);
      expect(tracker?.progress).toBe(50);
    });

    it('should update status', () => {
      const id = createProgressTracker('Test');
      updateProgress(id, { status: 'running' });
      
      const tracker = getProgress(id);
      expect(tracker?.status).toBe('running');
    });

    it('should update message', () => {
      const id = createProgressTracker('Test');
      updateProgress(id, { message: 'Processing...' });
      
      const tracker = getProgress(id);
      expect(tracker?.message).toBe('Processing...');
    });

    it('should clamp progress between 0 and 100', () => {
      const id = createProgressTracker('Test');
      
      updateProgress(id, { progress: 150 });
      expect(getProgress(id)?.progress).toBe(100);
      
      updateProgress(id, { progress: -50 });
      expect(getProgress(id)?.progress).toBe(0);
    });

    it('should set completedAt when status is completed', () => {
      const id = createProgressTracker('Test');
      updateProgress(id, { status: 'completed' });
      
      const tracker = getProgress(id);
      expect(tracker?.completedAt).toBeDefined();
      expect(tracker?.progress).toBe(100);
    });
  });

  describe('getProgress', () => {
    it('should return null for non-existent tracker', () => {
      const tracker = getProgress('non-existent');
      expect(tracker).toBeNull();
    });
  });

  describe('getAllProgress', () => {
    it('should return all progress trackers', () => {
      createProgressTracker('Test 1');
      createProgressTracker('Test 2');
      createProgressTracker('Test 3');
      
      const all = getAllProgress();
      expect(all.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('deleteProgress', () => {
    it('should delete a progress tracker', () => {
      const id = createProgressTracker('Test');
      expect(getProgress(id)).not.toBeNull();
      
      deleteProgress(id);
      expect(getProgress(id)).toBeNull();
    });

    it('should return false for non-existent tracker', () => {
      const result = deleteProgress('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('trackProgress', () => {
    it('should track progress of an async operation', async () => {
      const { result, trackerId } = await trackProgress(
        'Test Operation',
        10,
        async (update) => {
          update(50, 'Halfway there', 'Step 5');
          return 'done';
        }
      );
      
      expect(result).toBe('done');
      
      const tracker = getProgress(trackerId);
      expect(tracker?.status).toBe('completed');
      expect(tracker?.progress).toBe(100);
    });

    it('should handle errors in tracked operation', async () => {
      await expect(
        trackProgress('Failing Operation', 10, async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });
});
