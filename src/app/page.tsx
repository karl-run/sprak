import { Post } from "@prisma/client";
import { format } from "date-fns";
import React from "react";
import { prisma } from "../db/prisma";

async function Page(): Promise<JSX.Element> {
  const posts: Post[] = await prisma.post.findMany({
    orderBy: { updated: "desc" },
  });

  return (
    <div>
      <h3 className="p-4">posts</h3>
      {posts.map((post) => (
        <div key={post.ad_id}>
          <span>{post.text != null ? "✓" : "✖"}</span>
          <span>{post.heading ?? post.title} </span>
          <span
            className="text-xs"
            title={(post.updated ?? post.inserted).toISOString()}
          >
            {format(post.updated ?? post.inserted, "yyyy-MM-dd")}
          </span>
        </div>
      ))}
    </div>
  );
}

export const revalidate = 86400;

export default Page;
