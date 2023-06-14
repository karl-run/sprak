import * as R from "remeda";
import { prisma, Post } from "../db/prisma";
import { getPostText } from "./dom";
import { timeAsyncFn } from "./timing";
import { getMissingText } from "../db/queries";
import { getRandomTime, wait } from "./utils";

const ROOT = process.env.ROOT_URL;
const BASE_PARAMS = `search-qf?searchkey=SEARCH_ID_JOB_FULLTIME&occupation=0.23&sort=RELEVANCE&vertical=job`;
const URL = (page: number) => `${ROOT}/${BASE_PARAMS}&page=${page}`;

export async function pollPage(
  page: number
): Promise<[count: number, totalPages: number]> {
  const urlToFetch = URL(page);
  console.log("Fetching page", page, urlToFetch);
  const [result, time] = await timeAsyncFn(() => fetch(urlToFetch));

  if (!result.ok) {
    console.log("Unable to fetch page", page, result.status);
    await prisma.pageScrapeLog.create({
      data: {
        page: page,
        pages: -1,
        time,
        timestamp: new Date(),
        response: result.status,
      },
    });
    return [0, 1];
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

  const posts = mapPagesResult(json);

  await prisma.$transaction(
    posts.map((it) => {
      return prisma.post.upsert({
        where: { ad_id: it.ad_id },
        create: { ...it, inserted: new Date() },
        update: it,
      });
    })
  );

  return [posts.length, json.metadata.paging.last];
}

export async function updatePostTexts(
  count: number
): Promise<Record<number, string | null>> {
  const posts = await getMissingText(count);

  if (posts.length === 0) {
    console.log("No posts to update");
    return {};
  }

  const texts = R.fromPairs(
    await Promise.all(
      posts.map(async (it) => {
        await wait(getRandomTime(13, 269));
        return [it.ad_id, await pollPost(it)] satisfies [number, string | null];
      })
    )
  );

  await prisma.$transaction(
    posts.map((it) => {
      return prisma.post.update({
        where: { ad_id: it.ad_id },
        data: { text: texts[it.ad_id], updated: new Date() },
      });
    })
  );

  return texts;
}

export async function pollPost(post: Post): Promise<string | null> {
  const [response, time] = await timeAsyncFn(() => fetch(post.link));
  await prisma.postScrapeLog.create({
    data: {
      url: post.link,
      time,
      timestamp: new Date(),
      response: response.status,
    },
  });

  const doc = await response.text();
  return getPostText(doc);
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
  const basePath = process.env.ROOT_URL?.replace("/api", "");

  if (basePath == null) {
    throw new Error("ROOT_URL is not set!");
  }

  return R.pipe(
    json,
    R.prop("docs"),
    R.map((it: any) => ({
      ad_id: it.ad_id,
      type: it.type,
      heading: it.heading,
      title: it.job_title,
      company: it.company_name,
      link: `${basePath}/${it.ad_id}`,
      ad_type: it.ad_type,
      timestamp: new Date(it.timestamp),
      location: it.location,
    }))
  );
}
