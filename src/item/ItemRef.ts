import { Shelf } from '@/shelf/Shelf';
import { Archive } from './Archive';
import { DigiBook } from './DigiBook';
import { Item } from './Item';
import { ScookBook } from './ScookBook';

export class ItemRef {
  constructor(public shelf: Shelf, public url: string, public title: string) {}

  async resolve(): Promise<Item | null> {
    const page = await this.shelf.browser.newPage();
    try {
      await page.goto(this.url, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });

      const pageUrl = page.url();

      if (pageUrl.includes('scook.at')) {
        return new ScookBook(this.shelf, pageUrl, this.title);
      }

      if ((await page.$('#loadPage')) != null) {
        return new DigiBook(this.shelf, pageUrl, this.title);
      }

      if (
        await page.$$eval('script', (scripts) =>
          scripts.some((script) =>
            (script as HTMLScriptElement).src.includes('/ce.js')
          )
        )
      ) {
        return new Archive(this.shelf, pageUrl, this.title);
      }

      return null;
    } finally {
      await page.close();
    }
  }
}
