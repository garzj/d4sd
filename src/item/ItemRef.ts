import { Shelf } from '../shelf/Shelf';
import { Archive } from './Archive';
import { BiBoxBook } from './BiBoxBook';
import { DigiBook } from './DigiBook';
import { Item } from './Item';
import { OebvBook } from './OebvBook';
import { ScookBook } from './ScookBook';

export class ItemRef {
  constructor(
    public shelf: Shelf,
    public selector: string,
    public title: string
  ) {}

  async resolve(): Promise<Item | null> {
    const context = this.shelf.browser.defaultBrowserContext();
    const page = await this.shelf.browser.newPage();

    try {
      await page.goto(this.shelf.origin, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });

      await page.waitForSelector(this.selector, {
        timeout: this.shelf.options.timeout,
      });

      const newPagePromise = new Promise<import('puppeteer').Page>(
        (resolve) => {
          this.shelf.browser.once('targetcreated', async (target) => {
            if (target.type() === 'page') {
              const newPage = await target.page();
              if (newPage) {
                await newPage.bringToFront();
                resolve(newPage);
              }
            }
          });
        }
      );

      await page.click(this.selector);
      const newPage: any = await newPagePromise;

      await newPage.waitForLoadState?.('load').catch(() => {});

      await newPage
        .waitForNavigation({ waitUntil: 'load', timeout: 3000 })
        .catch(() => {});

      const pageUrl = newPage.url();

      if (pageUrl.includes('scook.at')) {
        return new ScookBook(this.shelf, pageUrl, this.title);
      }

      if (pageUrl.includes('bibox2.westermann.de')) {
        return new BiBoxBook(this.shelf, pageUrl, this.title);
      }

      if (pageUrl.includes('portal.oebv.at')) {
        return new OebvBook(this.shelf, pageUrl, this.title);
      }

      if ((await newPage.$('#loadPage')) != null) {
        return new DigiBook(this.shelf, pageUrl, this.title);
      }

      if (
        //TODO: NOT WORKING
        await page.$$eval('script', (scripts) =>
          scripts.some((script) =>
            (script as HTMLScriptElement).src.includes('/ce.js')
          )
        )
      ) {
        console.log('Archive detected');
        return new Archive(this.shelf, pageUrl, this.title);
      }

      return null;
    } finally {
      await page.close();
    }
  }
}
