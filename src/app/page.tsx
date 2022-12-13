import { Post } from "@prisma/client";
import React from "react";
import { prisma } from "../db/prisma";

async function Page(): Promise<JSX.Element> {
  const posts: Post[] = await prisma.post.findMany();

  return (
    <div>
      <h3>posts</h3>
      {posts.map((post) => (
        <div key={post.ad_id}>
          {post.text != null ? "✓" : "✖"} {post.heading ?? post.title}
        </div>
      ))}
    </div>
  );
}

export default Page;
