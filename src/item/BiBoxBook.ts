import { delay, promisePool } from '../util/promise';
import { Book } from './Book';
import { defDownloadOptions, DownloadOptions } from './download-options';

export class BiBoxBook extends Book {
  async download(outDir: string, _options?: DownloadOptions) {
    const dir = await this.mkSubDir(outDir);
    const options = defDownloadOptions(_options);

    // Get page urls
    let pageUrls: string[] = [];

    const page = await this.shelf.browser.newPage();
    try {
      await page.goto(this.url, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });

      const flipSelector = 'button#flip-right';
      await page.waitForSelector(flipSelector);

      // show only a single page
      await (
        await page.$(
          'button#page-mode:has(mat-icon[data-mat-icon-name="einzelseite"])'
        )
      )?.click();
      await page.waitForSelector('mat-icon[data-mat-icon-name="doppelseite"]');

      while (true) {
        await page.waitForSelector('app-page img');
        const urls = await page.$$eval('app-page img', (pageElms) =>
          pageElms.map((elm) => elm.src)
        );
        pageUrls.push(...urls);

        if (await page.$eval(flipSelector, (btn) => btn.disabled)) {
          break;
        }
        await page.click(flipSelector);
      }
    } finally {
      await page.close();
    }

    // Page download pool
    const pageCount = pageUrls.length;

    await promisePool(
      async (i) => {
        const pageNo = i + 1;
        const pageUrl = pageUrls[i];

        const page = await this.shelf.browser.newPage();
        try {
          await page.goto(pageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: this.shelf.options.timeout,
          });

          // Save it as pdf
          const pdfFile = this.getPdfPath(dir, pageNo);

          await page.pdf({
            height: await page.evaluate(
              () =>
                window.document.querySelector('img')?.height ||
                window.innerHeight
            ),
            width: await page.evaluate(
              () =>
                window.document.querySelector('img')?.width || window.innerWidth
            ),
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
