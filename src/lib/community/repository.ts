import type {
  CommunityCategory,
  CommunityNotification,
  CommunityReply,
  CommunityTopic,
  EpisodeSuggestion,
  ReportReason,
} from "@/lib/community/types";

export type TopicListParams = {
  cursor?: string;
  limit?: number;
  categoryId?: string;
};

export interface CommunityRepository {
  ensureReady(): Promise<void>;
  listCategories(): Promise<CommunityCategory[]>;
  hasAcceptedRules(userId: string, version: number): Promise<boolean>;
  acceptRules(userId: string, version: number): Promise<void>;
  listTopics(params: TopicListParams): Promise<{ topics: CommunityTopic[]; nextCursor?: string }>;
  getTopic(id: string): Promise<CommunityTopic | null>;
  createTopic(input: {
    title: string;
    body: string;
    categoryId: string;
    authorId: string;
  }): Promise<CommunityTopic>;
  updateTopicOwn(
    id: string,
    authorId: string,
    patch: { title?: string; body?: string },
  ): Promise<CommunityTopic>;
  listReplies(topicId: string): Promise<CommunityReply[]>;
  createReply(input: { topicId: string; authorId: string; body: string }): Promise<CommunityReply>;
  updateReplyOwn(
    id: string,
    authorId: string,
    body: string,
  ): Promise<CommunityReply>;
  createReport(input: {
    targetType: "topic" | "reply";
    targetId: string;
    reporterId: string;
    reason: ReportReason;
    detail?: string;
  }): Promise<void>;
  countRecentActions(userId: string, action: string, sinceMs: number): Promise<number>;
  recordAction(userId: string, action: string): Promise<void>;
  createSuggestion(input: Omit<EpisodeSuggestion, "id" | "protocol" | "createdAt" | "updatedAt">): Promise<EpisodeSuggestion>;
  listSuggestionsByAuthor(authorId: string): Promise<EpisodeSuggestion[]>;
  findSimilarSuggestions(caseTitle: string, excludeAuthorId: string): Promise<EpisodeSuggestion[]>;
  listNotifications(userId: string): Promise<CommunityNotification[]>;
  markNotificationRead(userId: string, id: string): Promise<void>;
  createNotification(input: Omit<CommunityNotification, "id" | "createdAt">): Promise<void>;
  searchTopics(query: string, limit: number): Promise<CommunityTopic[]>;
  /** Moderação */
  modSetTopicPinned(id: string, pinned: boolean, moderatorId: string, reason?: string): Promise<void>;
  modSetTopicStatus(
    id: string,
    status: CommunityTopic["status"],
    moderatorId: string,
    reason?: string,
  ): Promise<void>;
  modSetReplyStatus(
    id: string,
    status: CommunityReply["status"],
    moderatorId: string,
    reason?: string,
  ): Promise<void>;
  listPendingReports(): Promise<
    { id: string; targetType: string; targetId: string; reason: string; createdAt: string }[]
  >;
  adminListSuggestions(): Promise<EpisodeSuggestion[]>;
  adminUpdateSuggestion(
    id: string,
    patch: { status?: EpisodeSuggestion["status"]; memberMessage?: string; internalNote?: string },
    moderatorId: string,
  ): Promise<EpisodeSuggestion>;
}

let repo: CommunityRepository | null = null;

export async function getCommunityRepository(): Promise<CommunityRepository> {
  if (repo) return repo;
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (url) {
    const { createPostgresCommunityRepository } = await import("@/lib/community/repository-postgres");
    repo = createPostgresCommunityRepository(url);
  } else if (process.env.VERCEL) {
    throw new Error("POSTGRES_URL é obrigatório na Vercel para a Comunidade.");
  } else {
    const { createFileCommunityRepository } = await import("@/lib/community/repository-file");
    repo = createFileCommunityRepository();
  }
  await repo.ensureReady();
  return repo;
}
