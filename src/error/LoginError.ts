export class LoginError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, LoginError.prototype);
  }
}
