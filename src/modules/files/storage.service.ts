import { Injectable } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface StoredObject {
  key: string;
  url?: string | null;
}

@Injectable()
export class StorageService {
  private baseDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mime: string,
  ): Promise<StoredObject> {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
    const ext = filename.includes('.') ? filename.split('.').pop() : '';
    const key = `${randomUUID()}${ext ? '.' + ext : ''}`;
    const filepath = join(this.baseDir, key);
    await new Promise<void>((resolve, reject) => {
      const ws = createWriteStream(filepath);
      ws.on('error', reject);
      ws.on('finish', () => resolve());
      ws.write(buffer);
      ws.end();
    });
    const url = null;
    void mime;
    return { key, url };
  }

  getPathForKey(key: string): string {
    return join(this.baseDir, key);
  }
}
