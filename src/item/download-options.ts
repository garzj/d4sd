import defaultsDeep from 'defaults-deep-ts';
import { PaperFormat } from 'puppeteer';

export interface DownloadOptions {
  concurrency?: number;
  mergePdfs?: boolean;
  format?: PaperFormat;
}

const defaultOptions: Required<DownloadOptions> = {
  concurrency: 10,
  mergePdfs: true,
  format: 'a4',
};

export function defDownloadOptions(_options?: DownloadOptions) {
  const options = _options ?? {};
  return defaultsDeep(options, defaultOptions);
}
