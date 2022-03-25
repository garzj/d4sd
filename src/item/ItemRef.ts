import { Shelf } from '@/Shelf';
import { Item } from './Item';

export class ItemRef {
  constructor(public shelf: Shelf, public url: string, public title: string) {}

  async resolve(): Promise<Item | null> {
    return null;
  }
}
