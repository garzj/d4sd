#!/usr/bin/env node

import './config/env';

import { command, number, option, positional, run, string } from 'cmd-ts';
import { Shelf } from './Shelf';
import * as minimatch from 'minimatch';

const cmd = command({
  name: 'd4sd',
  description: 'Downloads books from https://digi4school.at/',
  version: '1.0.0',
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
      type: string,
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
  },
  handler: async (args) => {
    const shelf = await Shelf.load({
      email: args.email,
      password: args.password,
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
            return console.error(
              `Failed to resolve item type of "${itemRef.title}".`
            );
          }

          console.log(`Downloading ${itemRef.title}...`);
          await item.download(args.outDir, args.concurrency);
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
