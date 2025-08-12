import { basename } from 'path';
import { delay, promisePool } from '../util/promise';
import { Book } from './Book';
import { defDownloadOptions, DownloadOptions } from './download-options';
import { getPdfOptions } from './get-pdf-options';

export class BiBoxBook extends Book {
  async download(outDir: string, _options?: DownloadOptions) {
    const dir = await this.mkSubDir(outDir);
    const options = defDownloadOptions(_options);

    // get first page url
    let pageCount: number;
    const pageUrls = new Map<number, URL>();

    const page = await this.shelf.browser.newPage();
    try {
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (!url.pathname.startsWith('/bookpages')) return;
        const base = basename(url.pathname);
        const pageNoMatch = base.match(/[0-9]+/);
        if (!pageNoMatch) return;
        const pageNo = parseInt(pageNoMatch[0]);
        pageUrls.set(pageNo, url);
      });

      const bookFrameSelector = '#book-frame';

      await page.goto(this.url, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });
      await page.waitForSelector(bookFrameSelector);

      // Nav to first page
      const pageUrl = new URL(page.url());
      pageUrl.pathname = pageUrl.pathname.replace(
        /(?<=book\/[0-9]*)(\/|$).*/,
        '/page/1'
      );
      await page.goto(pageUrl.toString(), {
        timeout: this.shelf.options.timeout,
      });

      // Only show single pages
      const singlePageSelector = '#page-nav-layout .page-nav-button';
      const singlePageBtn = await page.waitForSelector(singlePageSelector);

      // Close popup
      const popupBtn = await page.$('.popup button');
      if (popupBtn) {
        await popupBtn.click();
      }

      await singlePageBtn?.click();
      await page.waitForSelector('.toggle-button.page-nav-button.selected');

      // Find page count, trigger page requests
      const flipSelector = '.page-nav-button.right';
      const flipBtn = (await page.waitForSelector(flipSelector))!;

      pageCount = 1;
      while (
        await page.evaluate(
          (s) => document.querySelector(s)?.ariaDisabled !== 'true',
          flipSelector
        )
      ) {
        await flipBtn.click();
        pageCount++;
      }

      // Wait for page requests
      const startTime = Date.now();
      while (pageUrls.size !== pageCount) {
        if (Date.now() - startTime > this.shelf.options.timeout) {
          throw 'Timeout when waiting for page urls.';
        }
        await delay(100);
      }
    } finally {
      await page.close();
    }

    // Page download pool
    let downloadedPages = 0;
    const getProgress = () => ({
      item: this,
      percentage: downloadedPages / pageCount,
      downloadedPages,
      pageCount,
    });
    options.onStart(getProgress());

    await promisePool(
      async (i) => {
        const pageNo = i + 1;
        const pageUrl = pageUrls.get(pageNo);
        if (!pageUrl) {
          throw `Page ${pageNo} has not been requested.`;
        }

        const page = await this.shelf.browser.newPage();
        try {
          await page.goto(pageUrl.toString(), {
            waitUntil: 'domcontentloaded',
            timeout: this.shelf.options.timeout,
          });

          // Save it as pdf
          const pdfFile = this.getPdfPath(dir, pageNo);

          await page.pdf({
            ...(await getPdfOptions(page, options)),
            path: pdfFile,
          });

          downloadedPages++;
          options.onProgress(getProgress());
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
