import * as R from "remeda";
import { NextApiRequest, NextApiResponse } from "next";
import { updatePostTexts } from "../../scraping/client";

export default async function PollPost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const postQueryParam = req.query.posts;
  const postsToPoll = postQueryParam ? +postQueryParam : 1;

  const updatedPosts = await updatePostTexts(postsToPoll);

  res.status(200).json({
    polled: R.toPairs(updatedPosts).map(([adId, result]) => [
      adId,
      result?.length ?? null,
    ]),
  });
}
