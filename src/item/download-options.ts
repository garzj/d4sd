import defaultsDeep from 'defaults-deep-ts';
import { PaperFormat } from 'puppeteer';

export interface DownloadOptions {
  concurrency?: number;
  mergePdfs?: boolean;
  format?: PaperFormat;
}

const defaultOptions: DownloadOptions = {
  concurrency: 10,
  mergePdfs: true,
};

export function defDownloadOptions(_options?: DownloadOptions) {
  const options = _options ?? {};
  return defaultsDeep(options, defaultOptions);
}
