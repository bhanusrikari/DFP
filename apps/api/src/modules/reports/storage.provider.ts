import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Local-disk implementation of the object-storage seam. Swap for an S3/R2
// client later (save/getPath keep the same signatures) — nothing outside
// this file needs to change.
export interface StorageProvider {
  save(originalFilename: string, buffer: Buffer): Promise<string>; // returns objectKey
  getPath(objectKey: string): string;
}

const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "uploads");

class LocalDiskStorageProvider implements StorageProvider {
  async save(originalFilename: string, buffer: Buffer): Promise<string> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(originalFilename);
    const objectKey = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, objectKey), buffer);
    return objectKey;
  }

  getPath(objectKey: string): string {
    return path.join(UPLOAD_DIR, objectKey);
  }
}

export const storageProvider: StorageProvider = new LocalDiskStorageProvider();
