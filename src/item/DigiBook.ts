import { promisePool } from '@/util/promise';
import { createWriteStream } from 'fs';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import * as pdf from 'pdfjs';
import { Item } from './Item';

export class DigiBook extends Item {
  async download(outDir: string, concurrency = 10, mergePdfs = true) {
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
    let pages = 0;
    function getPdfPath(pageNo: number) {
      return join(dir, `${pageNo}.pdf`);
    }

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
        const pdfFile = getPdfPath(++pages);

        await page.pdf({
          format: 'a4',
          path: pdfFile,
        });
      } finally {
        await page.close();
      }
    }, concurrency);

    // Merge pdf pages
    if (mergePdfs) {
      const mergedDoc = new pdf.Document();

      for (let pageNo = 1; pageNo <= pages; pageNo++) {
        const pdfFile = getPdfPath(pageNo);
        const buffer = await readFile(pdfFile);
        const pdfDoc = new pdf.ExternalDocument(buffer);
        mergedDoc.addPagesOf(pdfDoc);
      }

      const writeStream = createWriteStream(`${dir}.pdf`);
      mergedDoc.pipe(writeStream);
      await mergedDoc.end();
      await new Promise((resolve) => writeStream.once('close', resolve));

      await rm(dir, { recursive: true });
    }
  }
}
