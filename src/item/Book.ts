import { join } from 'path';
import { Item } from './Item';
import * as muhammara from 'muhammara';
import { promises } from 'fs';
const { rm } = promises;

export abstract class Book extends Item {
  getPdfPath(subDir: string, pageNo: number) {
    return join(subDir, `${pageNo}.pdf`);
  }

  async mergePdfPages(subDir: string, pageCount: number) {
    const outFile = `${subDir}.pdf`;
    const writeStream = new muhammara.PDFWStreamForFile(outFile);
    const writer = muhammara.createWriter(writeStream);

    for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
      const inFile = this.getPdfPath(subDir, pageNo);
      writer.appendPDFPagesFromPDF(inFile);
    }

    writer.end();
    await new Promise<void>((resolve) => writeStream.close(resolve));

    await rm(subDir, { recursive: true });
  }
}
