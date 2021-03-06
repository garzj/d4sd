#!/usr/bin/env node

import './config/env';

import {
  command,
  number,
  option,
  optional,
  positional,
  run,
  string,
} from 'cmd-ts';
import { Shelf } from './Shelf';
import * as minimatch from 'minimatch';
import { prompt } from 'inquirer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PaperFormat } from 'puppeteer';
import { paperFormats } from 'puppeteer/lib/cjs/puppeteer/common/PDFOptions';
import { hasOwnProperty } from './util/object';

const { version } = JSON.parse(
  readFileSync(join(__dirname, '../package.json')).toString()
);

const cmd = command({
  name: 'd4sd',
  description:
    'Digi4school Downloader\n' +
    'Downloads books from https://digi4school.at/\n' +
    'GitHub: https://github.com/garzj/d4sd',
  version,
  args: {
    title: positional({
      displayName: 'title',
      type: string,
      description:
        'The title of the book or archive you want to download. Supports glob patterns.',
    }),
    email: option({
      long: 'email',
      short: 'u',
      type: string,
      description: 'Your login email.',
    }),
    password: option({
      long: 'password',
      short: 'p',
      type: optional(string),
      description: 'Your login password.',
    }),
    concurrency: option({
      long: 'concurrency',
      short: 'c',
      type: number,
      defaultValue: () => 10,
      description: 'Specifies the maximum amount of pages downloaded at once.',
    }),
    outDir: option({
      long: 'out-dir',
      short: 'o',
      type: string,
      defaultValue: () => '.',
      description: 'The directory, the item should be saved into.',
    }),
    format: option({
      long: 'format',
      type: optional(string),
      description: 'A puppeteer page format like "a4".',
    }),
  },
  handler: async (args) => {
    if (args.format && !hasOwnProperty(paperFormats, args.format)) {
      console.error(
        `Invalid page format specified. Possible options are: ${JSON.stringify(
          Object.keys(paperFormats)
        )}`
      );
      return;
    }

    let password: string;
    if (args.password) {
      password = args.password;
    } else {
      password = (
        await prompt({
          name: 'password',
          type: 'password',
        })
      ).password;
      console.log('');
    }

    const shelf = await Shelf.load({
      email: args.email,
      password,
    });

    try {
      const itemRefs = await shelf.getItems();
      let itemCount = 0;
      for (let itemRef of itemRefs) {
        if (
          minimatch(itemRef.title, args.title, {
            nocase: true,
            dot: true,
            noglobstar: true,
            nocomment: true,
          })
        ) {
          itemCount++;

          console.log(`Resolving "${itemRef.title}"...`);
          const item = await itemRef.resolve();
          if (!item) {
            console.error(`Failed to resolve item type of "${itemRef.title}".`);
            continue;
          }

          console.log(`Downloading "${itemRef.title}..."`);
          try {
            await item.download(args.outDir, {
              ...args,
              format: args.format as PaperFormat,
            });
          } catch (e) {
            console.error(e);
            console.error(`Failed to download "${itemRef.title}!"`);
            continue;
          }
          console.log(`Successfully downloaded "${itemRef.title}"!`);
        }
      }

      if (itemCount === 0) {
        console.error(
          `No item matching the title "${args.title}" could be found.`
        );
      }
    } catch (e) {
      console.log(`Error: ${e}`);
    } finally {
      if (process.env.NODE_ENV !== 'development') {
        await shelf.destroy();
      }
    }
  },
});

run(cmd, process.argv.slice(2));
