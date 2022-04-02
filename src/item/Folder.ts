import { ItemRef } from './ItemRef';
import { Archive } from './Archive';
import { DigiDoc } from './DigiDoc';
import { ItemGroup } from './ItemGroup';

export class Folder extends ItemGroup {
  constructor(
    public archive: Archive,
    title: string,
    private items: (ItemRef | DigiDoc | Folder)[]
  ) {
    super(archive.shelf, archive.url, title);
  }

  async getItems(): Promise<(ItemRef | DigiDoc | Folder)[]> {
    return this.items;
  }
}
