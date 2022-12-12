import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../db/prisma";
import { pollPage } from "../../scraping/client";

export default async function PollPost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const posts = await pollPage(3);

  await Promise.all(
    posts.map((it) => {
      const item = { ...it, inserted: new Date() };
      return prisma.post.upsert({
        where: { ad_id: it.ad_id },
        create: item,
        update: item,
      });
    })
  );

  res.status(200).json({ inserted_posts: posts.length });
}
