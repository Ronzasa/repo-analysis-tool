/**
 * Batch processing utilities for handling large repositories
 * Processes commits in batches to avoid memory issues
 */

export interface BatchProcessorOptions {
  batchSize: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, batchIndex: number) => void;
}

/**
 * Process items in batches
 * @param items Array of items to process
 * @param processor Function to process each batch
 * @param options Batch processing options
 */
export async function processInBatches<T>(
  items: T[],
  processor: (batch: T[], batchIndex: number) => Promise<void>,
  options: BatchProcessorOptions
): Promise<void> {
  const { batchSize, onProgress, onError } = options;
  const totalBatches = Math.ceil(items.length / batchSize);
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batchIndex = Math.floor(i / batchSize);
    const batch = items.slice(i, i + batchSize);
    
    try {
      await processor(batch, batchIndex);
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }
    } catch (error) {
      if (onError) {
        onError(error as Error, batchIndex);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Chunk array into smaller arrays
 * @param array Array to chunk
 * @param size Chunk size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process commits in batches with memory management
 * @param commits Array of commit hashes
 * @param processor Function to process each commit
 * @param batchSize Number of commits per batch (default: 1000)
 */
export async function processCommitsInBatches(
  commits: string[],
  processor: (commitHash: string, index: number) => Promise<void>,
  batchSize: number = 1000,
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;
  
  await processInBatches(
    commits,
    async (batch, batchIndex) => {
      // Process each commit in the batch
      for (let i = 0; i < batch.length; i++) {
        const commitIndex = batchIndex * batchSize + i;
        try {
          await processor(batch[i], commitIndex);
          processed++;
        } catch (error) {
          errors++;
          console.error(`Error processing commit ${batch[i]}:`, error);
        }
      }
      
      // Force garbage collection hint (Node.js specific)
      if (global.gc) {
        global.gc();
      }
    },
    {
      batchSize,
      onProgress
    }
  );
  
  return { processed, errors };
}

/**
 * Memory-efficient streaming processor
 * Processes items one at a time to minimize memory usage
 */
export class StreamProcessor<T> {
  private items: T[] = [];
  private processor: ((item: T, index: number) => Promise<void>) | null = null;
  private processed = 0;
  private errors = 0;

  /**
   * Add items to the stream
   */
  addItems(items: T[]): void {
    this.items.push(...items);
  }

  /**
   * Set the processor function
   */
  setProcessor(processor: (item: T, index: number) => Promise<void>): void {
    this.processor = processor;
  }

  /**
   * Process all items in the stream
   */
  async process(onProgress?: (processed: number, total: number) => void): Promise<{ processed: number; errors: number }> {
    if (!this.processor) {
      throw new Error('Processor not set');
    }

    for (let i = 0; i < this.items.length; i++) {
      try {
        await this.processor(this.items[i], i);
        this.processed++;
      } catch (error) {
        this.errors++;
        console.error(`Error processing item ${i}:`, error);
      }

      if (onProgress) {
        onProgress(this.processed, this.items.length);
      }

      // Clear reference to allow garbage collection
      this.items[i] = null as any;
    }

    // Clear the array
    this.items = [];

    return { processed: this.processed, errors: this.errors };
  }

  /**
   * Reset the processor
   */
  reset(): void {
    this.items = [];
    this.processor = null;
    this.processed = 0;
    this.errors = 0;
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastCallTime = 0;

  constructor(private minInterval: number = 100) {} // Minimum ms between calls

  /**
   * Add a task to the queue
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  /**
   * Process the queue
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;

      if (timeSinceLastCall < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
      }

      const task = this.queue.shift();
      if (task) {
        this.lastCallTime = Date.now();
        await task();
      }
    }

    this.processing = false;
  }
}
