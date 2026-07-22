import { z } from "zod";

export const videoCreateSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  embedUrl: z.string().min(1).max(2000),
  description: z.string().max(20000).nullish(),
  summary: z.string().max(500).nullish(),
  thumbnail: z.string().max(2000).nullish(),
  featured: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v))).nullish(),
});

export const videoUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(50).optional(),
  embedUrl: z.string().min(1).max(2000).optional(),
  description: z.string().max(20000).nullish(),
  summary: z.string().max(500).nullish(),
  thumbnail: z.string().max(2000).nullish(),
  featured: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v))).nullish(),
});

export const postMutateSchema = z.object({
  title: z.string().max(200).nullish(),
  body: z.string().min(1).max(50000),
  tag: z.string().max(50).nullish(),
});

export const showreelMutateSchema = z.object({
  showreelUrl: z.string().max(2000),
  videoType: z.enum(["url", "upload"]).optional(),
});

export const heroMutateSchema = z.object({
  blobUrl: z.string().min(1).max(2000),
});

export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0),
      })
    )
    .min(1)
    .max(1000),
});