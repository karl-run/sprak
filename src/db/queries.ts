import { Post, prisma } from "./prisma";

export async function getMissingText(count: number = 1): Promise<Post[]> {
  const posts: Post[] = await prisma.post.findMany({
    where: { text: null },
    take: count,
  });

  console.log(`Found ${posts.length} posts with no text`);

  return posts;
}
