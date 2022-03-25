import { Item } from './Item';

export class Archive extends Item {
  async download(outDir: string) {
    throw 'Downloading archives has not been implemented yet.';
  }
}
