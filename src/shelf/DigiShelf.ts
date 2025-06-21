import { ScrapeError } from '../error/ScrapeError';
import { ItemRef } from '..';
import { InitOptions, Shelf } from './Shelf';

export class DigiShelf extends Shelf {
  static id = 'digi';

  private constructor() {
    super('https://digi4school.at/');
    this.origins.push('https://a.digi4school.at/');
  }

  static async load(options: InitOptions) {
    return await new DigiShelf().init(options);
  }

  protected async login() {
    await this.formLogin(
      '/login',
      '#ion-input-0',
      '#ion-input-1',
      'ion-button[color="primary"]',
      (page) =>
        Promise.race([
          page
            .waitForNavigation({ timeout: this.options.timeout })
            .then(() => true),
          page
            .waitForFunction(() => !!document.querySelector('ion-alert'), {
              timeout: this.options.timeout,
            })
            .then(() => false),
        ])
    );
  }

  async getItems(): Promise<ItemRef[]> {
    let books: { code: number; title: string }[];

    const page = await this.browser.newPage();
    try {
      const res = await page.goto(
        new URL('/br/xhr/v2/synch', this.origin).toString(),
        { waitUntil: 'domcontentloaded' }
      );
      if (!res || !res.ok || res.status() === 260) {
        throw new ScrapeError('Could to retrieve list of books from the API.');
      }
      const data = await res.json();
      books = data.books;
    } finally {
      await page.close();
    }

    return books.map(
      (book) =>
        new ItemRef(
          this,
          new URL(`/ebook/${book.code}`, this.origin).toString(),
          book.title
        )
    );
  }
}
