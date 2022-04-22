import { HTTPResponse, Page } from 'puppeteer';

export async function waitForGoto(
  page: Page,
  res: HTTPResponse | null
): Promise<HTTPResponse> {
  if (res == null) {
    res = await page.waitForResponse(() => true);
  }

  return res;
}
