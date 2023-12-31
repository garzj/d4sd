import { ScrapeError } from '../error/ScrapeError';
import { ItemRef } from '..';
import { InitOptions, Shelf } from './Shelf';

export class TraunerShelf extends Shelf {
  static id = 'trauner';

  constructor() {
    super('https://www.trauner-digibox.com/');
  }

  static async load(options: InitOptions) {
    return await new TraunerShelf().init(options);
  }

  protected async login() {
    await this.formLogin(
      '/',
      '#login-input',
      '#password-input',
      '#login > input[type="submit"]',
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
      await page.goto(new URL('/ebooks', this.origin).toString());

      const linkSelector = '#shelf a.ebook-link-box';
      await page.waitForSelector(linkSelector, {
        timeout: this.options.timeout,
      });

      const itemLinks = await page.$$(linkSelector);

      return await Promise.all(
        itemLinks.map(async (itemLink) => {
          const href = await itemLink.evaluate((a) => a.href);
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
