/**
 * Progress tracking service for long-running operations
 * Supports real-time updates via polling or WebSocket
 */

export interface ProgressUpdate {
  operation: string;
  progress: number; // 0-100
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  currentStep?: string;
  totalSteps?: number;
  currentStepNumber?: number;
  timestamp: number;
}

export interface ProgressTracker {
  id: string;
  operation: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  currentStep?: string;
  totalSteps?: number;
  currentStepNumber?: number;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
}

// In-memory store for progress trackers (use Redis or DB in production)
const progressStore = new Map<string, ProgressTracker>();

/**
 * Create a new progress tracker
 */
export function createProgressTracker(
  operation: string,
  totalSteps?: number
): string {
  const id = generateId();
  const tracker: ProgressTracker = {
    id,
    operation,
    progress: 0,
    status: 'pending',
    totalSteps,
    startedAt: Date.now(),
    updatedAt: Date.now()
  };

  progressStore.set(id, tracker);
  return id;
}

/**
 * Update progress tracker
 */
export function updateProgress(
  id: string,
  update: Partial<ProgressUpdate>
): void {
  const tracker = progressStore.get(id);
  if (!tracker) {
    throw new Error(`Progress tracker ${id} not found`);
  }

  if (update.progress !== undefined) {
    tracker.progress = Math.max(0, Math.min(100, update.progress));
  }
  if (update.status !== undefined) {
    tracker.status = update.status;
  }
  if (update.message !== undefined) {
    tracker.message = update.message;
  }
  if (update.currentStep !== undefined) {
    tracker.currentStep = update.currentStep;
  }
  if (update.currentStepNumber !== undefined) {
    tracker.currentStepNumber = update.currentStepNumber;
  }
  if (update.status === 'completed') {
    tracker.completedAt = Date.now();
    tracker.progress = 100;
  }
  if (update.status === 'failed' && update.message) {
    tracker.error = update.message;
  }

  tracker.updatedAt = Date.now();
  progressStore.set(id, tracker);
}

/**
 * Get progress tracker
 */
export function getProgress(id: string): ProgressTracker | null {
  return progressStore.get(id) || null;
}

/**
 * Get all progress trackers
 */
export function getAllProgress(): ProgressTracker[] {
  return Array.from(progressStore.values());
}

/**
 * Delete progress tracker
 */
export function deleteProgress(id: string): boolean {
  return progressStore.delete(id);
}

/**
 * Clean up old progress trackers (older than 1 hour)
 */
export function cleanupOldProgress(): void {
  const oneHourAgo = Date.now() - 3600000;
  
  for (const [id, tracker] of progressStore.entries()) {
    if (tracker.updatedAt < oneHourAgo) {
      progressStore.delete(id);
    }
  }
}

/**
 * Helper to track progress of an async operation
 */
export async function trackProgress<T>(
  operation: string,
  totalSteps: number,
  processor: (updateProgress: (progress: number, message?: string, step?: string) => void) => Promise<T>
): Promise<{ result: T; trackerId: string }> {
  const trackerId = createProgressTracker(operation, totalSteps);
  
  try {
    updateProgress(trackerId, {
      status: 'running',
      message: `Starting ${operation}...`
    });

    const result = await processor((progress, message, step) => {
      updateProgress(trackerId, {
        progress,
        message,
        currentStep: step,
        currentStepNumber: Math.floor((progress / 100) * totalSteps)
      });
    });

    updateProgress(trackerId, {
      status: 'completed',
      message: `${operation} completed successfully`,
      progress: 100
    });

    return { result, trackerId };
  } catch (error) {
    updateProgress(trackerId, {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      progress: 0
    });

    throw error;
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `progress_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Clean up old trackers every 30 minutes
setInterval(cleanupOldProgress, 1800000);
