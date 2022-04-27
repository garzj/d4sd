export const hasOwnProperty = (obj: object, prop: string | number) =>
  Object.prototype.hasOwnProperty.call(obj, prop);
