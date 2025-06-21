import { LoginError } from '../error/LoginError';
import * as puppeteer from 'puppeteer';
import { ItemRef } from '../item/ItemRef';

export interface InitOptions {
  user: string;
  password: string;
  timeout?: number;
}

type Options = Required<InitOptions>;

export abstract class Shelf {
  options!: Options;
  browser!: puppeteer.Browser;

  public origins: string[];

  protected constructor(public origin: string) {
    this.origins = [origin];
  }

  protected async init(options: InitOptions) {
    this.options = {
      ...options,
      timeout: options.timeout ?? 60000,
    };
    this.browser = await puppeteer.launch({
      headless: true,
    });
    try {
      await this.login();
    } catch (e) {
      await this.destroy();
      throw e;
    }
    return this;
  }

  protected abstract login(): Promise<void>;

  protected async formLogin(
    url: string,
    userSelector: string,
    passwordSelector: string,
    loginBtnSelector: string,
    successCheck: (page: puppeteer.Page) => Promise<boolean>
  ) {
    const page = await this.browser.newPage();
    try {
      await page.goto(new URL(url, this.origin).toString());
      await page.waitForFunction(
        (selectors: string[]) =>
          selectors.every((s) => document.querySelector(s) !== null),
        {
          timeout: this.options.timeout,
        },
        [userSelector, passwordSelector, loginBtnSelector]
      );

      await page.type(userSelector, this.options.user);
      await page.type(passwordSelector, this.options.password);
      await page.click(loginBtnSelector);

      if (!(await successCheck(page))) {
        throw new LoginError(`Login to ${this.origin} failed.`);
      }
    } finally {
      await page.close();
    }
  }

  abstract getItems(): Promise<ItemRef[]>;

  async destroy() {
    await this.browser.close();
  }
}
