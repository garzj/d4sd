import { serialize } from 'cookie';
import { Cookie } from 'puppeteer';

export function serializeCookies(cookies: Cookie[]): string {
  return cookies
    .map((c) =>
      serialize(c.name, c.value, {
        encode: (v) => v,
      })
    )
    .join('; ');
}
