import { z } from "zod";
import { REPORT_REASONS } from "@/lib/community/types";

export const topicCreateSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(8000),
  categoryId: z.string().min(1),
});

export const topicPatchSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  body: z.string().min(10).max(8000).optional(),
});

export const replySchema = z.object({
  body: z.string().min(2).max(6000),
});

export const reportSchema = z.object({
  targetType: z.enum(["topic", "reply"]),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  detail: z.string().max(500).optional(),
});

export const suggestionSchema = z.object({
  caseTitle: z.string().min(3).max(160),
  location: z.string().max(160).optional(),
  summary: z.string().min(20).max(4000),
  relevance: z.string().min(20).max(2000),
  sourceLinks: z.array(z.string()).max(8),
  sensitiveContent: z.boolean(),
  noPrivateDataConfirmed: z.literal(true),
  clientToken: z.string().max(64).optional(),
});
