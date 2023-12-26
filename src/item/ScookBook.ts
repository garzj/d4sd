import { ScrapeError } from '../error/ScrapeError';
import { delay, promisePool } from '../util/promise';
import { Book } from './Book';
import { defDownloadOptions, DownloadOptions } from './download-options';
import { getPdfOptions } from './get-pdf-options';

export class ScookBook extends Book {
  async download(outDir: string, _options?: DownloadOptions) {
    const dir = await this.mkSubDir(outDir);
    const options = defDownloadOptions(_options);

    // Get book frame url
    let bookFrameUrl: string;

    const userPage = await this.shelf.browser.newPage();
    try {
      await userPage.goto(this.url, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });

      bookFrameUrl = await userPage.$eval(
        '.book-frame',
        (bookFrame) => (bookFrame as HTMLIFrameElement).src
      );
    } finally {
      await userPage.close();
    }

    // Get page count, first page url
    let pageCount: number;
    let pageXUrl: string;

    const page = await this.shelf.browser.newPage();
    try {
      await page.goto(bookFrameUrl, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });

      while (true) {
        try {
          pageCount = parseInt(
            await page.$eval(
              '#total-pages',
              (totalPages) => (totalPages as HTMLSpanElement).innerText
            )
          );
        } catch (e) {
          await delay(1000);
          continue;
        }
        if (isNaN(pageCount)) continue;
        break;
      }

      const img = await page.$('.image-div > img');
      if (!img) {
        throw new ScrapeError('Could not locate scook book page image.');
      }
      pageXUrl = await img.evaluate((img) => (img as HTMLImageElement).src);
    } finally {
      await page.close();
    }

    // Page download pool
    await promisePool(
      async (i) => {
        const pageNo = i + 1;

        const page = await this.shelf.browser.newPage();
        try {
          await page.goto(
            pageXUrl.replace(
              /(?<=-)[0-9]+(?=\.)/g,
              pageNo.toString().padStart(3, '0')
            ),
            {
              waitUntil: 'domcontentloaded',
              timeout: this.shelf.options.timeout,
            }
          );

          // Save it as pdf
          const pdfFile = this.getPdfPath(dir, pageNo);

          await page.pdf({
            ...(await getPdfOptions(page, options)),
            path: pdfFile,
          });
        } finally {
          await page.close();
        }
      },
      options.concurrency,
      pageCount
    );

    // Merge pdf pages
    options.mergePdfs && (await this.mergePdfPages(dir, pageCount));
  }
}
