import { ScrapeError } from '../error/ScrapeError';
import { ItemRef } from '..';
import { InitOptions, Shelf } from './Shelf';

export class DigiShelf extends Shelf {
  static id = 'digi';

  private constructor() {
    super('https://digi4school.at/books');
  }

  static async load(options: InitOptions) {
    return await new DigiShelf().init(options);
  }

  protected async login() {
    await this.formLogin(
      '/',
      '#ion-input-0',
      '#ion-input-1',
      'ion-button[color="primary"]',
      (page) =>
        Promise.race([
          page
            .waitForNavigation({ timeout: this.options.timeout })
            .then(() => true),
          page
            .waitForFunction(
              () =>
                document
                  .querySelector('div[role="dialog"]')
                  ?.innerHTML.includes('Problem'),
              { timeout: this.options.timeout }
            )
            .then(() => false),
        ])
    );
  }

  async getItems(): Promise<ItemRef[]> {
    const page = await this.browser.newPage();
    try {
      await page.goto(new URL('/books', this.origin).toString());
      await page.waitForSelector('#ebooksGrid > ion-row > ion-col', {
        timeout: this.options.timeout,
      });

      const itemLinks = await page.$$('#ebooksGrid > ion-row > ion-col');

      return await Promise.all(
        itemLinks.map(async (itemLink) => {
          const tempSelector = await itemLink.$('ion-thumbnail')
          
          const uniqueSelector = await page.evaluate((el) => {
            let path = '';
            while (el.parentElement) {
              const tag = el.tagName.toLowerCase();
              const siblings = Array.from(el.parentElement.children);
              const index = siblings.indexOf(el) + 1;
              path = ` > ${tag}:nth-child(${index})` + path;
              el = el.parentElement;
            }
            return path.slice(3);
          }, itemLink);

          const title = await tempSelector?.evaluate((el) => el.getAttribute('title'))

          if (!title) {
            throw new ScrapeError(
              `Could not find the title of item with url ${"test"}.`
            );
          }

          return new ItemRef(this, uniqueSelector, title);
        })
      );
    } finally {
      await page.close();
    }
  }
}
