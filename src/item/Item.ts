import { Shelf } from '../shelf/Shelf';
import { join } from 'path';
import sanitize from 'sanitize-filename';
import { promises } from 'fs';
import { DownloadOptions } from './download-options';
const { mkdir } = promises;

export abstract class Item {
  constructor(
    public shelf: Shelf,
    public url: string,
    public title: string
  ) {
    this.title = sanitize(title);
  }

  abstract download(outDir: string, options?: DownloadOptions): Promise<void>;

  async mkSubDir(outDir: string) {
    const dir = join(outDir, this.title);
    await mkdir(dir, { recursive: true });
    return dir;
  }
}
