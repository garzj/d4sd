import { serialize } from 'cookie';
import { Protocol } from 'puppeteer';

export function serializeCookies(cookies: Protocol.Network.Cookie[]): string {
  return cookies
    .map((c) =>
      serialize(c.name, c.value, {
        encode: (v) => v,
      })
    )
    .join('; ');
}
