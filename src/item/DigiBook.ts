import { Item } from './Item';

export class DigiBook extends Item {
  async download(outDir: string) {
    throw 'The book download has not been implemented yet.';
  }
}
