import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { pipeline } from 'stream';
import * as zlib from 'zlib';

const pipelineAsync = promisify(pipeline);

// Simple unzip using built-in Node.js
export async function extractZip(zipPath: string, targetPath: string): Promise<string> {
  /**
   * Extract a ZIP file to target directory
   * Note: This is a simplified version. For production, use a library like 'unzipper' or 'adm-zip'
   */
  
  // Ensure target directory exists
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  // For now, we'll use a child process to call unzip
  // In production, use a proper Node.js library
  const { exec } = await import('child_process');
  const execAsync = promisify(exec);
  
  try {
    await execAsync(`unzip -q "${zipPath}" -d "${targetPath}"`);
    return targetPath;
  } catch (error) {
    throw new Error(`Failed to extract ZIP file: ${error}`);
  }
}

export async function extractZipBuffer(buffer: Buffer, targetPath: string): Promise<string> {
  /**
   * Extract ZIP from buffer to target directory
   */
  
  // Ensure target directory exists
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  // Write buffer to temp file
  const tempZipPath = path.join(targetPath, 'temp.zip');
  fs.writeFileSync(tempZipPath, buffer);

  try {
    await extractZip(tempZipPath, targetPath);
    // Clean up temp file
    fs.unlinkSync(tempZipPath);
    return targetPath;
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    throw error;
  }
}

export function isZipFile(filePath: string): boolean {
  /**
   * Check if a file is a ZIP file by checking magic bytes
   */
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);
  
  // ZIP magic bytes: PK\x03\x04
  return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
}
