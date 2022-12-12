export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function getRandomTime(from: number, to: number) {
  const min = Math.ceil(from);
  const max = Math.floor(to);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
