#!/usr/bin/env node

import './config/env';
import { command, run } from 'cmd-ts';

const cmd = command({
  name: 'd4sd',
  description: 'Downloads books from https://digi4school.at/',
  version: '1.0.0',
  args: {},
  handler: (args) => {
    console.log(args);
  },
});

run(
  cmd,
  process.env.NODE_ENV === 'development' && process.env.DEV_ARGS
    ? process.env.DEV_ARGS.split(' ')
    : process.argv.slice(2)
);
