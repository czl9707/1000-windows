import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/chapters',
    // A chapter is a folder: NN-<name>/index.mdx plus its code files. The NN-
    // prefix is the chapter order (see src/lib/chapters.ts); the route drops it.
    generateId: ({ entry }) => {
      const id = entry.replace(/\.mdx$/, '');
      return id.endsWith('/index') ? id.slice(0, -'/index'.length) : id;
    },
  }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { chapters };
