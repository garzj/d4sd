import { promisePool } from '../util/promise';
import { waitForGoto } from '../util/puppeteer';
import { URL } from 'url';
import { Book } from './Book';
import { defDownloadOptions, DownloadOptions } from './download-options';
import { SizeAttributes, getPdfOptions } from './get-pdf-options';

export class DigiBook extends Book {
  async download(outDir: string, _options?: DownloadOptions) {
    const dir = await this.mkSubDir(outDir);
    const options = defDownloadOptions(_options);
    options.format ??= 'a4';

    // Get url of 1st svg page
    const checkPage = await this.shelf.browser.newPage();
    let page1Url: string;
    let sizeHint: SizeAttributes;
    try {
      await checkPage.goto(new URL(`?page=1`, this.url).toString(), {
        waitUntil: 'networkidle2',
        timeout: this.shelf.options.timeout,
      });
      [page1Url, sizeHint] = await checkPage.$eval(
        '#pg1 > object',
        (obj: HTMLObjectElement): [string, SizeAttributes] => [
          obj.data,
          { width: obj.width, height: obj.height },
        ]
      );
    } finally {
      await checkPage.close();
    }

    // Page download pool
    let pageCount = 0;

    await promisePool(async (i, stop) => {
      const pageNo = i + 1;

      const page = await this.shelf.browser.newPage();
      try {
        // Go to current svg page
        const base = this.url.replace(/(?<=\/)[^\/]+$/g, '');
        const pageUrl = new URL(
          page1Url
            .slice(base.length)
            .replace(/(?<=\/|^)1(?=\/|\.|$)/gm, pageNo.toString()),
          base
        ).toString();
        const res = await waitForGoto(
          page,
          await page.goto(pageUrl, {
            waitUntil: 'networkidle0',
            timeout: this.shelf.options.timeout,
          })
        );
        if (!res.ok()) return stop();

        // Save it as pdf
        const pdfFile = this.getPdfPath(dir, pageNo);

        await page.pdf({
          ...(await getPdfOptions(page, options, sizeHint)),
          path: pdfFile,
        });

        pageCount++;
      } finally {
        await page.close();
      }
    }, options.concurrency);

    // Merge pdf pages
    options.mergePdfs && (await this.mergePdfPages(dir, pageCount));
  }
}
