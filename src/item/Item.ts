import { Shelf } from '@/Shelf';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import sanitize = require('sanitize-filename');

export abstract class Item {
  constructor(public shelf: Shelf, public url: string, public title: string) {
    this.title = sanitize(title);
  }

  abstract download(outDir: string, concurrency?: number): Promise<void>;

  async mkSubDir(outDir: string) {
    const dir = join(outDir, this.title);
    await mkdir(dir, { recursive: true });
    return dir;
  }
}
