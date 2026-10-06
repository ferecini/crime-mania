export type CommunityTopicStatus = "open" | "closed" | "hidden" | "removed";
export type CommunityReplyStatus = "visible" | "hidden" | "removed";
export type EpisodeSuggestionStatus =
  | "received"
  | "under_review"
  | "needs_information"
  | "accepted"
  | "not_selected"
  | "closed";

export type CommunityTopic = {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  categoryLabel?: string;
  authorId: string;
  authorDisplayName?: string;
  status: CommunityTopicStatus;
  isPinned: boolean;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityReply = {
  id: string;
  topicId: string;
  authorId: string;
  authorDisplayName?: string;
  body: string;
  status: CommunityReplyStatus;
  createdAt: string;
  updatedAt: string;
};

export type CommunityCategory = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  active: boolean;
};

export type CommunityNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  linkHref?: string;
  readAt?: string;
  createdAt: string;
};

export type EpisodeSuggestion = {
  id: string;
  protocol: string;
  authorId: string;
  caseTitle: string;
  location?: string;
  summary: string;
  relevance: string;
  sourceLinks: string[];
  sensitiveContent: boolean;
  noPrivateDataConfirmed: boolean;
  status: EpisodeSuggestionStatus;
  memberMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export const COMMUNITY_RULES_VERSION = 1;

export const REPORT_REASONS = [
  "personal_data",
  "unsourced_accusation",
  "victim_disrespect",
  "harassment",
  "spam",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
