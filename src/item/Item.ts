import { Shelf } from '@/Shelf';
import { mkdir } from 'fs/promises';
import { join } from 'path';

export abstract class Item {
  constructor(public shelf: Shelf, public url: string, public title: string) {}

  abstract download(outDir: string, concurrency?: number): Promise<void>;

  async mkSubDir(outDir: string) {
    const dir = join(outDir, this.title);
    await mkdir(dir, { recursive: true });
    return dir;
  }
}
