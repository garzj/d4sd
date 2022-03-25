import { Shelf } from '@/Shelf';
import { Page } from 'puppeteer';
import { ItemRef } from './ItemRef';

export abstract class Item {
  constructor(public shelf: Shelf, public url: string, public title: string) {}

  abstract download(outDir: string): Promise<void>;
}
