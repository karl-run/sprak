import * as R from "remeda";
import { prisma, Post } from "../db/prisma";
import { getPostText } from "./dom";
import { timeAsyncFn } from "./timing";

const ROOT = process.env.ROOT_URL;
const BASE_PARAMS = `search-qf?searchkey=SEARCH_ID_JOB_FULLTIME&occupation=0.23&sort=RELEVANCE&vertical=job`;
const URL = (page: number) => `${ROOT}/${BASE_PARAMS}&page=${page}`;

export async function pollPage(
  page: number
): Promise<[count: number, totalPages: number]> {
  const [result, time] = await timeAsyncFn(() => fetch(URL(page)));

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

export async function pollFirstEmptyPost(): Promise<Post | null> {
  const postWithNoText: Post | null = await prisma.post.findFirst({
    where: { text: null },
  });

  if (postWithNoText == null) {
    console.warn("Found post with no text, skipping");
    return null;
  }

  const [response, time] = await timeAsyncFn(() => fetch(postWithNoText.link));
  await prisma.postScrapeLog.create({
    data: {
      url: postWithNoText.link,
      time,
      timestamp: new Date(),
      response: response.status,
    },
  });

  const doc = await response.text();
  const text = getPostText(doc);

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
