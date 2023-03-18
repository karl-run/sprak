import { NextResponse } from "next/server";

import { pollPage } from "../../../scraping/client";
import { getRandomTime, wait } from "../../../scraping/utils";

export default async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const pageQueryParam = searchParams.get("page");
  const pageToPoll = pageQueryParam ? +pageQueryParam : -1;

  if (pageToPoll >= 1) {
    const [length] = await pollPage(pageToPoll);
    return NextResponse.json({ inserted_posts: length });
  } else {
    const [length, totalPages] = await pollPage(1);
    if (totalPages < 2) {
      console.warn("Only a single page, probably not right");
      return NextResponse.json({ inserted_posts: length });
    }

    const lengths = await Promise.all(
      Array.from(Array(totalPages - 1).keys()).map(async (it) => {
        const page = it + 2;
        const timeToSleep = page * 137 + getRandomTime(137, 137 * 3);
        console.log(`Sleeping ${page} for ${timeToSleep / 1000} seconds`);

        await wait(timeToSleep);
        return pollPage(page).catch((err) => {
          console.error("Error polling page", page, err);
          return [0, 0];
        });
      })
    );

    return NextResponse.json({
      inserted_posts:
        length + lengths.map((it) => it[0]).reduce((acc, item) => acc + item),
    });
  }
}

export const runtime = "nodejs";
