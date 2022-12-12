import { NextApiRequest, NextApiResponse } from "next";
import { pollFirstEmptyPost } from "../../scraping/client";
import { getRandomTime, wait } from "../../scraping/utils";

export default async function PollPost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await wait(getRandomTime(69, 1337));
  const first = await pollFirstEmptyPost();
  await wait(getRandomTime(69, 1337));
  const second = await pollFirstEmptyPost();
  await wait(getRandomTime(69, 1337));
  const third = await pollFirstEmptyPost();

  res
    .status(200)
    .json({
      polled: [
        first?.ad_id ?? null,
        second?.ad_id ?? null,
        third?.ad_id ?? null,
      ],
    });
}
