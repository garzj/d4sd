import { Shelf } from '../Shelf';
import { DigiDoc } from './DigiDoc';
import { Folder } from './Folder';
import { ItemGroup } from './ItemGroup';
import { ItemRef } from './ItemRef';

interface Directory {
  title: string;
  items: (ItemRef | DigiDoc)[];
}

export class Archive extends ItemGroup {
  async getItems(): Promise<(ItemRef | DigiDoc | Folder)[]> {
    const page = await this.shelf.browser.newPage();
    try {
      await page.goto(this.url, {
        waitUntil: 'networkidle2',
      });

      // Find archive directories: id -> name
      const dirEntries: [number, string][] = await page.$$eval(
        '#content > a.directory',
        (a) =>
          (a as HTMLLinkElement[]).map((a) => {
            const dirTitle = a.querySelector('h1')?.innerText;
            if (!dirTitle) {
              throw `Could not find the title of a folder in archive with url ${window.location.href}.`;
            }
            return [parseInt(a.id), dirTitle];
          })
      );
      const dirs: Record<number, Directory> = {};
      for (const dirEntry of dirEntries) {
        dirs[dirEntry[0]] = {
          title: dirEntry[1],
          items: [],
        };
      }

      // Find item links
      const itemLinks = await page.$$('#content > a:not(.directory)');

      // Fill dirs and items
      const items: (ItemRef | DigiDoc)[] = [];

      await Promise.all(
        itemLinks.map(async (itemLink) => {
          // Get item url and title
          const href = await itemLink.evaluate(
            (a) => (a as HTMLLinkElement).href
          );
          const url = new URL(href, Shelf.origin).toString();

          let title = await itemLink.evaluate(
            (a) => a.querySelector('h1')?.innerText
          );
          if (!title) {
            throw `Could not find the title of an item with url ${url}.`;
          }

          let item: ItemRef | DigiDoc;

          const pathname = new URL(url).pathname;
          if (!(/^\/ebook\/\w+$/.test(pathname) || pathname.endsWith('html'))) {
            item = new DigiDoc(this, url, title);
          } else {
            item = new ItemRef(this.shelf, url, title);
          }

          // Append to folder or itemRefs
          const classList = await itemLink.evaluate((a) =>
            Array.from(a.classList)
          );
          if (classList.includes('sub')) {
            const dirId = parseInt(
              classList.find((className) => className !== 'sub')!
            );
            if (!isFinite(dirId)) {
              throw `Could not determine the folder id of item "${title}" in archive with url ${this.url}.`;
            }
            if (!Object.prototype.hasOwnProperty.call(dirs, dirId)) {
              throw `Could not match directory id ${dirId} to a directory in archive with url ${this.url}.`;
            }

            dirs[dirId].items.push(item);
          } else {
            items.push(item);
          }
        })
      );

      // Return items and folders
      return [
        ...items,
        ...Object.values(dirs).map(
          (dir) => new Folder(this, dir.title, dir.items)
        ),
      ];
    } finally {
      await page.close();
    }
  }
}
