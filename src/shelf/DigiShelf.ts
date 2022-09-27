import { ScrapeError } from '@/error/ScrapeError';
import { ItemRef } from '..';
import { InitOptions, Shelf } from './Shelf';

export class DigiShelf extends Shelf {
  constructor() {
    super('https://digi4school.at/');
  }

  static async load(options: InitOptions) {
    return await new DigiShelf().init(options);
  }

  protected async login() {
    await this.formLogin(
      '/',
      '#email',
      '#password',
      '#login > button',
      (page) =>
        Promise.race([
          page
            .waitForNavigation({ timeout: this.options.timeout })
            .then(() => true),
          page
            .waitForFunction(() =>
              document
                .querySelector('div[role="dialog"]')
                ?.innerHTML.includes('Problem')
            )
            .then(() => false),
        ])
    );
  }

  async getItems(): Promise<ItemRef[]> {
    const page = await this.browser.newPage();
    try {
      await page.goto(new URL('/ebooks', this.origin).toString());
      await page.waitForSelector('#shelf > a');

      const itemLinks = await page.$$('#shelf > a');

      return await Promise.all(
        itemLinks.map(async (itemLink) => {
          const href = await itemLink.evaluate(
            (a) => (a as HTMLLinkElement).href
          );
          const url = new URL(href, this.origin).toString();

          const title = await itemLink.evaluate(
            (a) => a.querySelector('h1')?.innerText
          );
          if (!title) {
            throw new ScrapeError(
              `Could not find the title of item with url ${url}.`
            );
          }

          return new ItemRef(this, url, title);
        })
      );
    } finally {
      await page.close();
    }
  }
}
