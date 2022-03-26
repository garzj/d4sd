import { Item } from './Item';

export class ScookBook extends Item {
  async download(outDir: string, concurrency = 10) {
    throw 'Downloading books from scook.at has not been implemented yet.';
  }
}
