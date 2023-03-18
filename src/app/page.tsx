import { Post } from "@prisma/client";
import { format } from "date-fns";
import React, { Suspense } from "react";
import * as R from "remeda";
import { prisma } from "../db/prisma";

import styles from "./page.module.css";

async function Page(): Promise<JSX.Element> {
  const posts: Post[] = await prisma.post.findMany({
    orderBy: { updated: "desc" },
  });

  const [instant, stream] = R.splitAt(posts, 10);

  return (
    <div>
      <h3>posts</h3>
      {instant.map((post) => (
        <PostItem key={post.ad_id} post={post} />
      ))}
      <Suspense fallback={<Skellington />}>
        {/* @ts-expect-error Server Component */}
        <TheRest items={stream} />
      </Suspense>
    </div>
  );
}

function PostItem({ post }: { post: Post }): JSX.Element {
  return (
    <div>
      <span>{post.text != null ? "✓" : "✖"}</span>
      <span>{post.heading ?? post.title} </span>
      <span
        className={styles.smoll}
        title={(post.updated ?? post.inserted).toISOString()}
      >
        {format(post.updated ?? post.inserted, "yyyy-MM-dd")}
      </span>
    </div>
  );
}

async function TheRest({ items }: { items: Post[] }) {
  return (
    <>
      {items.map((post) => (
        <PostItem key={post.ad_id} post={post} />
      ))}
    </>
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
