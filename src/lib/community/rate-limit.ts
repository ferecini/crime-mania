import type { CommunityRepository } from "@/lib/community/repository";

export const RATE_LIMITS = {
  topicCreate: { max: 5, windowMs: 60 * 60 * 1000 },
  replyCreate: { max: 40, windowMs: 60 * 60 * 1000 },
  suggestionCreate: { max: 3, windowMs: 24 * 60 * 60 * 1000 },
  reportCreate: { max: 15, windowMs: 24 * 60 * 60 * 1000 },
} as const;

export async function assertRateLimit(
  repo: CommunityRepository,
  userId: string,
  action: keyof typeof RATE_LIMITS,
): Promise<void> {
  const { max, windowMs } = RATE_LIMITS[action];
  const count = await repo.countRecentActions(userId, action, windowMs);
  if (count >= max) {
    throw new RateLimitError("Muitas ações em pouco tempo. Tente novamente mais tarde.");
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}
