import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../db/prisma";
import { pollFirstEmptyPost, pollPage } from "../../scraping/client";

export default async function PollPost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const polledPost = await pollFirstEmptyPost();

  res.status(200).json({ polled: polledPost?.ad_id ?? null });
}
