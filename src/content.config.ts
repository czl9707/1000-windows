import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    status: z.enum(['draft', 'landed']),
  }),
});

export const collections = { chapters };
