import { JSDOM } from "jsdom";

export function getPostText(doc: string): string | null {
  const { document } = new JSDOM(doc, {}).window;

  document
    .querySelectorAll("style")
    .forEach((it: HTMLStyleElement) => it.remove());
  document
    .querySelectorAll("script")
    .forEach((it: HTMLScriptElement) => it.remove());

  const text = document
    .querySelector(".u-word-break")
    ?.textContent?.replace(/\s+/g, " ")
    .trim();

  return text ?? null;
}
