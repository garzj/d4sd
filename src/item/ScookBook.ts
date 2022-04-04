import { delay, promisePool } from '@/util/promise';
import { Book } from './Book';

export class ScookBook extends Book {
  async download(outDir: string, concurrency = 10, mergePdfs = true) {
    const dir = await this.mkSubDir(outDir);

    // Get book frame url
    let bookFrameUrl: string;

    const userPage = await this.shelf.browser.newPage();
    try {
      await userPage.goto(this.url, {
        waitUntil: 'networkidle2',
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
        waitUntil: 'networkidle2',
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
        break;
      }

      const img = await page.$('.image-div > img');
      if (!img) {
        throw 'Could not locate scook book page image.';
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
              waitUntil: 'networkidle2',
            }
          );

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
      concurrency,
      pageCount
    );

    // Merge pdf pages
    mergePdfs && (await this.mergePdfPages(dir, pageCount));
  }
}
