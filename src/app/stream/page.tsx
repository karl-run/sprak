import { Post } from "@prisma/client";
import { format } from "date-fns";
import React, { Suspense } from "react";
import * as R from "remeda";
import { prisma } from "../../db/prisma";
import { headers } from "next/headers";

async function Page(): Promise<JSX.Element> {
  // This is normally how you would get something user specific, causing this to be a SSR-ed page
  const userCookie = headers().get("user-specifi-cookie");

  const posts: Post[] = await prisma.post.findMany({
    orderBy: { updated: "desc" },
    take: 10,
  });

  return (
    <div>
      <h3 className="p-4">posts</h3>
      {posts.map((post) => (
        <PostItem key={post.ad_id} post={post} />
      ))}
      <Suspense fallback={<Skellington />}>
        <TheRest />
      </Suspense>
    </div>
  );
}

async function TheRest() {
  const posts: Post[] = await prisma.post.findMany({
    orderBy: { updated: "desc" },
    skip: 10,
  });

  return (
    <>
      {posts.map((post) => (
        <PostItem key={post.ad_id} post={post} />
      ))}
    </>
  );
}

function PostItem({ post }: { post: Post }): JSX.Element {
  return (
    <div>
      <span>{post.text != null ? "✓" : "✖"}</span>
      <span>{post.heading ?? post.title} </span>
      <span
        className="text-xs"
        title={(post.updated ?? post.inserted).toISOString()}
      >
        {format(post.updated ?? post.inserted, "yyyy-MM-dd")}
      </span>
    </div>
  );
}

function Skellington(): JSX.Element {
  return (
    <div>
      {R.pipe(
        R.range(0, 3),
        R.map((it) => <div key={it}>I am a skelington</div>)
      )}
    </div>
  );
}

export default Page;
