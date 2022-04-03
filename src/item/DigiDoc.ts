import { serializeCookies } from '@/util/cookie';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { join } from 'path';
import { Archive } from './Archive';
import { Item } from './Item';

export class DigiDoc extends Item {
  constructor(public archive: Archive, url: string, title: string) {
    super(archive.shelf, url, title);
  }

  async download(outDir: string) {
    const page = await this.shelf.browser.newPage();
    try {
      // Get archive cookies
      await page.goto(this.archive.url, {
        waitUntil: 'networkidle2',
      });
      const cookies = await page.cookies();

      // Download file
      const res = await fetch(this.url, {
        headers: {
          credentials: 'include',
          cookie: serializeCookies(cookies),
        },
      });
      const dest = createWriteStream(join(outDir, this.title));
      res.body?.pipe(dest);
    } finally {
      await page.close();
    }
  }
}