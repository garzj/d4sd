#!/usr/bin/env node

import './config/env';
import { command, option, run, string } from 'cmd-ts';
import { Shelf } from './Shelf';

const cmd = command({
  name: 'd4sd',
  description: 'Downloads books from https://digi4school.at/',
  version: '1.0.0',
  args: {
    email: option({
      long: 'email',
      type: string,
    }),
    password: option({
      long: 'password',
      type: string,
    }),
  },
  handler: async (args) => {
    const shelf = await Shelf.load({
      email: args.email,
      password: args.password,
    });

    const itemRefs = await shelf.getItems();
    console.log(itemRefs);

    if (process.env.NODE_ENV !== 'development') {
      await shelf.destroy();
    }
  },
});

run(
  cmd,
  process.env.NODE_ENV === 'development' && process.env.DEV_ARGS
    ? process.env.DEV_ARGS.split(' ')
    : process.argv.slice(2)
);
