import { createWriteStream } from 'fs';
import { join } from 'path';
import * as pdf from 'pdfjs';
import { Item } from './Item';
import { promises } from 'fs';
const { readFile, rm } = promises;

export abstract class Book extends Item {
  abstract download(
    outDir: string,
    concurrency?: number,
    mergePdfs?: boolean
  ): Promise<void>;

  getPdfPath(subDir: string, pageNo: number) {
    return join(subDir, `${pageNo}.pdf`);
  }

  async mergePdfPages(subDir: string, pageCount: number) {
    const mergedDoc = new pdf.Document();

    for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
      const pdfFile = this.getPdfPath(subDir, pageNo);
      const buffer = await readFile(pdfFile);
      const pdfDoc = new pdf.ExternalDocument(buffer);
      mergedDoc.addPagesOf(pdfDoc);
    }

    const writeStream = createWriteStream(`${subDir}.pdf`);
    mergedDoc.pipe(writeStream);
    await mergedDoc.end();
    await new Promise((resolve) => writeStream.once('close', resolve));

    await rm(subDir, { recursive: true });
  }
}
