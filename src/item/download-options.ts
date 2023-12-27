import { PaperFormat } from 'puppeteer';
import { Item } from './Item';
import { ItemGroup } from './ItemGroup';
import { Book } from './Book';

export type DownloadProgress<I extends Item = Item> = {
  percentage: number;
  item: I;
} & (I extends Book
  ? { downloadedPages: number; pageCount: number }
  : I extends ItemGroup
  ? { downloadedItems: Item[]; items: Item[] }
  : {});

export interface DownloadOptions {
  concurrency?: number;
  mergePdfs?: boolean;
  format?: PaperFormat;
  onStart?: (progress: DownloadProgress) => void;
  onProgress?: (progress: DownloadProgress) => void;
}

export function defDownloadOptions(_options?: DownloadOptions) {
  return (<T extends DownloadOptions>(x: T) => x)({
    ..._options,
    concurrency: _options?.concurrency ?? 10,
    mergePdfs: _options?.mergePdfs ?? true,
    onStart: _options?.onStart ?? (() => {}),
    onProgress: _options?.onProgress ?? (() => {}),
  });
}
