import { NextApiRequest, NextApiResponse } from "next";
import { pollPage } from "../../scraping/client";
import { getRandomTime, wait } from "../../scraping/utils";

export default async function PollPost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const pageQueryParam = req.query.page;
  const pageToPoll = pageQueryParam ? +pageQueryParam : -1;

  if (pageToPoll >= 1) {
    const [length] = await pollPage(pageToPoll);
    res.status(200).json({ inserted_posts: length });
  } else {
    const [length, totalPages] = await pollPage(1);
    if (totalPages < 2) {
      console.warn("Only a single page, probably not right");
      res.status(200).json({ inserted_posts: length });
      return;
    }

    const lengths = await Promise.all(
      Array.from(Array(totalPages - 1).keys()).map(async (it) => {
        const page = it + 2;
        const timeToSleep = page * 1337 + getRandomTime(1337, 1337 * 2);
        console.log(`Sleeping ${page} for ${timeToSleep / 1000} seconds`);

        await wait(timeToSleep);
        return pollPage(page).catch((err) => {
          console.error("Error polling page", page, err);
          return [0, 0];
        });
      })
    );

    res.status(200).json({
      inserted_posts:
        length + lengths.map((it) => it[0]).reduce((acc, item) => acc + item),
    });
  }
}
