export async function timeAsyncFn<T>(fn: () => Promise<T>): Promise<[result: T, time: number]> {
  const t1 = performance.now();
  const result = await fn();
  const t2 = performance.now();
  const time = t2 - t1;

  return [result, time];
}
