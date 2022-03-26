export async function promisePool<T>(
  factory: (i: number, stop: () => void) => Promise<T>,
  concurrency = 10
): Promise<T[]> {
  let done: Promise<T>[] = [];
  let stoppers: Promise<T>[] = [];
  let running: Promise<T>[] = [];

  for (let i = 0; stoppers.length === 0; ) {
    while (stoppers.length === 0 && running.length < concurrency) {
      const promise = factory(i++, () => stoppers.push(promise));
      running.push(promise);
      promise.then(() => {
        running = running.filter((p) => p !== promise);
        done.push(promise);
      });
    }

    await Promise.race(running);
  }
  done.push(...running);

  done = done.filter((promise) => !stoppers.includes(promise));

  return await Promise.all(done);
}
