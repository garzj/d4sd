export class ScrapeError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ScrapeError.prototype);
  }
}
