import { Item } from './Item';

export class Archive extends Item {
  async download(outDir: string, concurrency = 10) {
    throw 'Downloading archives has not been implemented yet.';
  }
}
