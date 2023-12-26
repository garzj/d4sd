import { PDFOptions, Page } from 'puppeteer';
import { DownloadOptions } from './download-options';

export interface SizeAttributes {
  width: string;
  height: string;
}

export async function getPdfOptions(
  page: Page,
  options: DownloadOptions,
  sizeHint?: SizeAttributes
): Promise<PDFOptions> {
  const size = await page.evaluate(async (sizeHint): Promise<PDFOptions> => {
    const root = document.documentElement;

    if (root instanceof SVGGraphicsElement) {
      if (sizeHint) {
        root.setAttribute('width', sizeHint.width);
        root.setAttribute('height', sizeHint.height);
        return sizeHint;
      }
      const bbox = root.getBBox();
      return { width: bbox.width, height: bbox.height };
    }

    if (sizeHint) return sizeHint;

    return {
      width:
        document.querySelector<HTMLImageElement>('body > img')?.width ??
        window.innerWidth,
      height:
        document.querySelector<HTMLImageElement>('body > img')?.height ??
        window.innerHeight,
    };
  }, sizeHint);

  return {
    format: options.format,
    printBackground: true,
    ...size,
  };
}
