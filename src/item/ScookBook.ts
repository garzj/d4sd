import { Item } from './Item';

export class ScookBook extends Item {
  async download(outDir: string) {
    throw 'Downloading books from scook.at has not been implemented yet.';
  }
}
