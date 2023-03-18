import * as R from "remeda";
import { NextResponse } from "next/server";
import { updatePostTexts } from "../../../scraping/client";

export default async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const postQueryParam = searchParams.get("posts");
  const postsToPoll = postQueryParam ? +postQueryParam : 1;

  const updatedPosts = await updatePostTexts(postsToPoll);

  return NextResponse.json({
    polled: R.pipe(
      updatedPosts,
      R.toPairs,
      R.map(([adId, result]) => [adId, result?.length ?? null])
    ),
  });
}

export const runtime = "nodejs";
