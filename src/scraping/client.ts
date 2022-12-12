import * as R from "remeda";
import { prisma, Post } from "../db/prisma";
import { JSDOM } from "jsdom";

const ROOT = process.env.ROOT_URL;
const BASE_PARAMS = `search-qf?searchkey=SEARCH_ID_JOB_FULLTIME&occupation=0.23&sort=RELEVANCE&vertical=job`;
const URL = (page: number) => `${ROOT}/${BASE_PARAMS}&page=${page}`;

export async function pollPage(page: number): Promise<PostResponse[]> {
  const t1 = performance.now();
  const result = await fetch(URL(page));
  const t2 = performance.now();
  const time = t2 - t1;

  if (!result.ok) {
    await prisma.pageScrapeLog.create({
      data: {
        page: page,
        pages: -1,
        time,
        timestamp: new Date(),
        response: result.status,
      },
    });
    return [];
  }

  const json = await result.json();
  await prisma.pageScrapeLog.create({
    data: {
      page: page,
      pages: json.metadata.paging.last,
      time,
      timestamp: new Date(),
      response: result.status,
    },
  });

  return mapPagesResult(json);
}

export async function pollFirstEmptyPost(): Promise<Post | null> {
  const postWithNoText: Post | null = await prisma.post.findFirst({
    where: { text: null },
  });

  if (postWithNoText == null) {
    console.warn("Found post with no text, skipping");
    return null;
  }

  const t1 = performance.now();
  const response = await fetch(postWithNoText.link);
  const t2 = performance.now();
  const time = t2 - t1;

  await prisma.postScrapeLog.create({
    data: {
      url: postWithNoText.link,
      time,
      timestamp: new Date(),
      response: response.status,
    },
  });

  const doc = await response.text();
  const { document } = new JSDOM(doc, {}).window;

  if (document == null) {
    console.warn("Document is null, skipping");
    return null;
  }

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

  console.log("text yoo", text);

  await prisma.post.update({
    where: { id: postWithNoText.id },
    data: { text, updated: new Date() },
  });

  return postWithNoText;
}

type PostResponse = {
  ad_id: number;
  type: string;
  heading: string;
  title: string;
  company: string;
  link: string;
  ad_type: number;
  timestamp: Date;
  location: string;
};

function mapPagesResult(json: any): PostResponse[] {
  return R.pipe(
    json,
    R.prop("docs"),
    R.map((it: any) => ({
      ad_id: it.ad_id,
      type: it.type,
      heading: it.heading,
      title: it.job_title,
      company: it.company_name,
      link: it.ad_link,
      ad_type: it.ad_type,
      timestamp: new Date(it.timestamp),
      location: it.location,
    }))
  );
}
