import { NextApiRequest, NextApiResponse } from "next";
import { pollFirstEmptyPost } from "../../scraping/client";
import { getRandomTime, wait } from "../../scraping/utils";

export default async function PollPost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const postQueryParam = req.query.posts;
  const postsToPoll = postQueryParam ? +postQueryParam : 1;

  const results = [];
  for (let i = 0; i < postsToPoll; i++) {
    await wait(getRandomTime(69, 137));
    const item = await pollFirstEmptyPost();

    results.push(item);
  }

  res.status(200).json({
    polled: results.map((it) => it?.ad_id ?? null),
  });
}
