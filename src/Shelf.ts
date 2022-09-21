import * as puppeteer from 'puppeteer';
import { ItemRef } from './item/ItemRef';

interface InitOptions {
  email: string;
  password: string;
  timeout?: number;
}

type Options = Required<InitOptions>;

export class Shelf {
  static origin = 'https://digi4school.at/';

  options!: Options;
  browser!: puppeteer.Browser;

  private constructor(options: InitOptions) {
    this.options = {
      ...options,
      timeout: options.timeout ?? 60000,
    };
  }

  static async load(options: InitOptions) {
    const shelf = new Shelf(options);
    shelf.browser = await puppeteer.launch({
      headless: true,
    });
    await shelf.login();
    return shelf;
  }

  private async login() {
    const page = await this.browser.newPage();
    try {
      await page.goto(new URL('/', Shelf.origin).toString());
      await page.waitForSelector('#login > button');

      await page.type('#email', this.options.email);
      await page.type('#password', this.options.password);
      await page.click('#login > button');
      await page.waitForNavigation().catch(() => {
        throw 'Login failed.';
      });
    } finally {
      await page.close();
    }
  }

  async getItems(): Promise<ItemRef[]> {
    const page = await this.browser.newPage();
    try {
      await page.goto(new URL('/ebooks', Shelf.origin).toString());
      await page.waitForSelector('#shelf > a');

      const itemLinks = await page.$$('#shelf > a');

      return await Promise.all(
        itemLinks.map(async (itemLink) => {
          const href = await itemLink.evaluate(
            (a) => (a as HTMLLinkElement).href
          );
          const url = new URL(href, Shelf.origin).toString();

          const title = await itemLink.evaluate(
            (a) => a.querySelector('h1')?.innerText
          );
          if (!title) {
            throw `Could not find the title of item with url ${url}.`;
          }

          return new ItemRef(this, url, title);
        })
      );
    } finally {
      await page.close();
    }
  }

  async destroy() {
    await this.browser.close();
  }
}
