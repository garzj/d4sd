import { ItemRef } from '..';
import { InitOptions, Shelf } from './Shelf';

export class ScookShelf extends Shelf {
  constructor() {
    super('https://www.scook.at/');
  }

  static async load(options: InitOptions) {
    return await new ScookShelf().init(options);
  }

  protected async login() {
    await this.formLogin(
      '/auth/puma',
      '#Input_Username',
      '#input-login-password',
      'form#account button[type="submit"]',
      (page) =>
        Promise.race([
          page.waitForSelector('.validation-summary-errors').then(() => false),
          page
            .waitForSelector('#page-advanced-user-dashboard')
            .then(() => true),
        ])
    );
  }

  async getItems(): Promise<ItemRef[]> {
    // const page = await this.browser.newPage();
    // try {
    //   await page.goto(new URL('/schreibtisch', this.origin).toString());
    // } finally {
    //   await page.close();
    // }

    // TODO: Scrape actual list
    return [];
  }
}
