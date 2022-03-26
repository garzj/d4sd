import { promisePool } from '@/util/promise';
import { join } from 'path';
import { Item } from './Item';

export class DigiBook extends Item {
  async download(outDir: string, concurrency = 10) {
    const dir = await this.mkSubDir(outDir);

    await promisePool(async (i, stop) => {
      const bookPage = i + 1;

      const page = await this.shelf.browser.newPage();
      try {
        const res = await page.goto(
          new URL(`${bookPage}.svg`, this.url).toString(),
          {
            waitUntil: 'networkidle2',
          }
        );
        if (res.status() !== 200) return stop();

        await page.pdf({
          format: 'a4',
          path: join(dir, `${bookPage}.pdf`),
        });
      } finally {
        await page.close();
      }
    }, concurrency);
  }
}
