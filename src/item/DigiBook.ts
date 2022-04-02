import { promisePool } from '@/util/promise';
import { join } from 'path';
import { Item } from './Item';

export class DigiBook extends Item {
  async download(outDir: string, concurrency = 10) {
    const dir = await this.mkSubDir(outDir);

    // Get url of 1st svg page
    const checkPage = await this.shelf.browser.newPage();
    let page1Url: string;
    try {
      await checkPage.goto(new URL(`?page=1`, this.url).toString(), {
        waitUntil: 'networkidle2',
      });
      page1Url = await checkPage.$eval(
        '#pg1 > object',
        (obj) => (obj as HTMLObjectElement).data
      );
    } finally {
      await checkPage.close();
    }

    // Page download pool
    await promisePool(async (i, stop) => {
      const pageNo = i + 1;

      const page = await this.shelf.browser.newPage();
      try {
        // Go to current svg page
        const res = await page.goto(
          new URL(
            page1Url.replace(/(?<=\/)1(?=\.|$)/g, pageNo.toString()),
            this.url
          ).toString(),
          {
            waitUntil: 'networkidle2',
          }
        );
        if (!res.ok()) return stop();

        // Save it as pdf
        await page.pdf({
          format: 'a4',
          path: join(dir, `${pageNo}.pdf`),
        });
      } finally {
        await page.close();
      }
    }, concurrency);
  }
}
