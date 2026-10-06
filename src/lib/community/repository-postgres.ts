import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { DEFAULT_CATEGORIES } from "@/lib/community/categories-seed";
import type { CommunityRepository } from "@/lib/community/repository";
import type {
  CommunityCategory,
  CommunityNotification,
  CommunityReply,
  CommunityTopic,
  EpisodeSuggestion,
} from "@/lib/community/types";

function nowIso(): string {
  return new Date().toISOString();
}

function protocolFromDate(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `CM-SUG-${y}${m}${day}-${seq}`;
}

type TopicRow = {
  id: string;
  title: string;
  body: string;
  category_id: string;
  author_id: string;
  status: CommunityTopic["status"];
  is_pinned: boolean;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  category_label?: string;
};

function mapTopic(row: TopicRow): CommunityTopic {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    categoryId: row.category_id,
    categoryLabel: row.category_label,
    authorId: row.author_id,
    status: row.status,
    isPinned: row.is_pinned,
    replyCount: row.reply_count,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createPostgresCommunityRepository(url: string): CommunityRepository {
  const sql = neon(url);

  async function audit(
    moderatorId: string,
    action: string,
    targetType: string,
    targetId: string,
    reason?: string,
  ) {
    await sql`
      INSERT INTO moderation_audit (id, moderator_id, action, target_type, target_id, reason)
      VALUES (${randomUUID()}, ${moderatorId}, ${action}, ${targetType}, ${targetId}, ${reason ?? null})
    `;
  }

  return {
    async ensureReady() {
      for (const c of DEFAULT_CATEGORIES) {
        await sql`
          INSERT INTO community_categories (id, slug, label, sort_order, active)
          VALUES (${c.id}, ${c.slug}, ${c.label}, ${c.sortOrder}, ${c.active})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    },

    async listCategories() {
      const rows = await sql`
        SELECT id, slug, label, sort_order, active FROM community_categories
        WHERE active = TRUE ORDER BY sort_order ASC
      `;
      return rows.map(
        (r) =>
          ({
            id: r.id as string,
            slug: r.slug as string,
            label: r.label as string,
            sortOrder: r.sort_order as number,
            active: r.active as boolean,
          }) satisfies CommunityCategory,
      );
    },

    async hasAcceptedRules(userId, version) {
      const rows = await sql`
        SELECT 1 FROM community_rules_acceptance
        WHERE user_id = ${userId} AND rules_version = ${version} LIMIT 1
      `;
      return rows.length > 0;
    },

    async acceptRules(userId, version) {
      await sql`
        INSERT INTO community_rules_acceptance (user_id, rules_version)
        VALUES (${userId}, ${version})
        ON CONFLICT DO NOTHING
      `;
    },

    async listTopics(params) {
      const limit = Math.min(params.limit ?? 20, 50);
      const categoryId = params.categoryId;
      const rows = categoryId
        ? await sql`
            SELECT t.*, c.label AS category_label
            FROM community_topics t
            JOIN community_categories c ON c.id = t.category_id
            WHERE t.status IN ('open', 'closed') AND t.category_id = ${categoryId}
            ORDER BY t.is_pinned DESC, t.last_activity_at DESC
          `
        : await sql`
            SELECT t.*, c.label AS category_label
            FROM community_topics t
            JOIN community_categories c ON c.id = t.category_id
            WHERE t.status IN ('open', 'closed')
            ORDER BY t.is_pinned DESC, t.last_activity_at DESC
          `;
      const list = rows.map((r) => mapTopic(r as TopicRow));
      let start = 0;
      if (params.cursor) {
        const idx = list.findIndex((t) => t.id === params.cursor);
        start = idx >= 0 ? idx + 1 : 0;
      }
      const slice = list.slice(start, start + limit);
      const nextCursor = start + limit < list.length ? slice[slice.length - 1]?.id : undefined;
      return { topics: slice, nextCursor };
    },

    async getTopic(id) {
      const rows = await sql`
        SELECT t.*, c.label AS category_label
        FROM community_topics t
        JOIN community_categories c ON c.id = t.category_id
        WHERE t.id = ${id} LIMIT 1
      `;
      if (!rows[0]) return null;
      return mapTopic(rows[0] as TopicRow);
    },

    async createTopic(input) {
      const id = randomUUID();
      const ts = nowIso();
      await sql`
        INSERT INTO community_topics (id, title, body, category_id, author_id, last_activity_at, created_at, updated_at)
        VALUES (${id}, ${input.title}, ${input.body}, ${input.categoryId}, ${input.authorId}, ${ts}::timestamptz, ${ts}::timestamptz, ${ts}::timestamptz)
      `;
      return (await this.getTopic(id))!;
    },

    async updateTopicOwn(id, authorId, patch) {
      const existing = await this.getTopic(id);
      if (!existing) throw new Error("Tópico não encontrado.");
      if (existing.authorId !== authorId) throw new Error("Sem permissão.");
      if (existing.status === "removed" || existing.status === "hidden") throw new Error("Tópico indisponível.");
      const title = patch.title ?? existing.title;
      const body = patch.body ?? existing.body;
      await sql`
        UPDATE community_topics SET title = ${title}, body = ${body}, updated_at = NOW() WHERE id = ${id}
      `;
      return (await this.getTopic(id))!;
    },

    async listReplies(topicId) {
      const rows = await sql`
        SELECT id, topic_id, author_id, body, status, created_at, updated_at
        FROM community_replies
        WHERE topic_id = ${topicId} AND status = 'visible'
        ORDER BY created_at ASC
      `;
      return rows.map(
        (r) =>
          ({
            id: r.id as string,
            topicId: r.topic_id as string,
            authorId: r.author_id as string,
            body: r.body as string,
            status: r.status as CommunityReply["status"],
            createdAt: (r.created_at as Date).toISOString(),
            updatedAt: (r.updated_at as Date).toISOString(),
          }) satisfies CommunityReply,
      );
    },

    async createReply(input) {
      const topic = await this.getTopic(input.topicId);
      if (!topic) throw new Error("Tópico não encontrado.");
      if (topic.status !== "open") throw new Error("Tópico fechado para respostas.");
      const id = randomUUID();
      await sql`
        INSERT INTO community_replies (id, topic_id, author_id, body)
        VALUES (${id}, ${input.topicId}, ${input.authorId}, ${input.body})
      `;
      await sql`
        UPDATE community_topics
        SET reply_count = reply_count + 1, last_activity_at = NOW(), updated_at = NOW()
        WHERE id = ${input.topicId}
      `;
      const rows = await sql`SELECT * FROM community_replies WHERE id = ${id}`;
      const r = rows[0];
      return {
        id: r.id as string,
        topicId: r.topic_id as string,
        authorId: r.author_id as string,
        body: r.body as string,
        status: r.status as CommunityReply["status"],
        createdAt: (r.created_at as Date).toISOString(),
        updatedAt: (r.updated_at as Date).toISOString(),
      };
    },

    async updateReplyOwn(id, authorId, body) {
      const rows = await sql`SELECT * FROM community_replies WHERE id = ${id}`;
      const r = rows[0];
      if (!r) throw new Error("Resposta não encontrada.");
      if (r.author_id !== authorId) throw new Error("Sem permissão.");
      if (r.status !== "visible") throw new Error("Resposta indisponível.");
      await sql`UPDATE community_replies SET body = ${body}, updated_at = NOW() WHERE id = ${id}`;
      return {
        id: r.id as string,
        topicId: r.topic_id as string,
        authorId: r.author_id as string,
        body,
        status: r.status as CommunityReply["status"],
        createdAt: (r.created_at as Date).toISOString(),
        updatedAt: nowIso(),
      };
    },

    async createReport(input) {
      await sql`
        INSERT INTO community_reports (id, target_type, target_id, reporter_id, reason, detail)
        VALUES (${randomUUID()}, ${input.targetType}, ${input.targetId}, ${input.reporterId}, ${input.reason}, ${input.detail ?? null})
      `;
    },

    async countRecentActions(userId, action, sinceMs) {
      const since = new Date(Date.now() - sinceMs).toISOString();
      const rows = await sql`
        SELECT COUNT(*)::int AS c FROM community_rate_events
        WHERE user_id = ${userId} AND action = ${action} AND created_at >= ${since}::timestamptz
      `;
      return (rows[0]?.c as number) ?? 0;
    },

    async recordAction(userId, action) {
      await sql`
        INSERT INTO community_rate_events (id, user_id, action) VALUES (${randomUUID()}, ${userId}, ${action})
      `;
    },

    async createSuggestion(input) {
      const id = randomUUID();
      const protocol = protocolFromDate();
      await sql`
        INSERT INTO episode_suggestions (
          id, protocol, author_id, case_title, location, summary, relevance,
          source_links, sensitive_content, no_private_data_confirmed, status, member_message
        ) VALUES (
          ${id}, ${protocol}, ${input.authorId}, ${input.caseTitle}, ${input.location ?? null},
          ${input.summary}, ${input.relevance}, ${JSON.stringify(input.sourceLinks)}::jsonb,
          ${input.sensitiveContent}, ${input.noPrivateDataConfirmed}, ${input.status}, ${input.memberMessage ?? null}
        )
      `;
      const rows = await sql`SELECT * FROM episode_suggestions WHERE id = ${id}`;
      return mapSuggestion(rows[0]);
    },

    async listSuggestionsByAuthor(authorId) {
      const rows = await sql`
        SELECT id, protocol, author_id, case_title, location, summary, relevance, source_links,
               sensitive_content, no_private_data_confirmed, status, member_message, created_at, updated_at
        FROM episode_suggestions WHERE author_id = ${authorId} ORDER BY created_at DESC
      `;
      return rows.map(mapSuggestion);
    },

    async findSimilarSuggestions(caseTitle, excludeAuthorId) {
      const needle = `%${caseTitle.trim().slice(0, 20).toLowerCase()}%`;
      const rows = await sql`
        SELECT id, protocol, author_id, case_title, location, summary, relevance, source_links,
               sensitive_content, no_private_data_confirmed, status, member_message, created_at, updated_at
        FROM episode_suggestions
        WHERE author_id <> ${excludeAuthorId} AND LOWER(case_title) LIKE ${needle}
        LIMIT 5
      `;
      return rows.map(mapSuggestion);
    },

    async listNotifications(userId) {
      const rows = await sql`
        SELECT id, user_id, type, title, body, link_href, read_at, created_at
        FROM community_notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC LIMIT 50
      `;
      return rows.map(mapNotification);
    },

    async markNotificationRead(userId, id) {
      await sql`
        UPDATE community_notifications SET read_at = NOW()
        WHERE id = ${id} AND user_id = ${userId} AND read_at IS NULL
      `;
    },

    async createNotification(input) {
      await sql`
        INSERT INTO community_notifications (id, user_id, type, title, body, link_href)
        VALUES (${randomUUID()}, ${input.userId}, ${input.type}, ${input.title}, ${input.body}, ${input.linkHref ?? null})
      `;
    },

    async searchTopics(query, limit) {
      const q = `%${query.toLowerCase()}%`;
      const rows = await sql`
        SELECT t.*, c.label AS category_label FROM community_topics t
        JOIN community_categories c ON c.id = t.category_id
        WHERE t.status IN ('open', 'closed')
        AND (LOWER(t.title) LIKE ${q} OR LOWER(t.body) LIKE ${q})
        LIMIT ${limit}
      `;
      return rows.map((r) => mapTopic(r as TopicRow));
    },

    async modSetTopicPinned(id, pinned, moderatorId, reason) {
      await sql`UPDATE community_topics SET is_pinned = ${pinned}, updated_at = NOW() WHERE id = ${id}`;
      await audit(moderatorId, pinned ? "pin_topic" : "unpin_topic", "topic", id, reason);
    },

    async modSetTopicStatus(id, status, moderatorId, reason) {
      await sql`UPDATE community_topics SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
      await audit(moderatorId, `topic_status_${status}`, "topic", id, reason);
    },

    async modSetReplyStatus(id, status, moderatorId, reason) {
      const rows = await sql`SELECT topic_id, status FROM community_replies WHERE id = ${id}`;
      if (!rows[0]) throw new Error("Resposta não encontrada.");
      const prev = rows[0].status as string;
      await sql`UPDATE community_replies SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
      if (prev === "visible" && status !== "visible") {
        await sql`
          UPDATE community_topics SET reply_count = GREATEST(0, reply_count - 1), updated_at = NOW()
          WHERE id = ${rows[0].topic_id as string}
        `;
      }
      await audit(moderatorId, `reply_status_${status}`, "reply", id, reason);
    },

    async listPendingReports() {
      const rows = await sql`
        SELECT id, target_type, target_id, reason, created_at FROM community_reports
        WHERE status = 'pending' ORDER BY created_at DESC
      `;
      return rows.map((r) => ({
        id: r.id as string,
        targetType: r.target_type as string,
        targetId: r.target_id as string,
        reason: r.reason as string,
        createdAt: (r.created_at as Date).toISOString(),
      }));
    },

    async adminListSuggestions() {
      const rows = await sql`
        SELECT * FROM episode_suggestions ORDER BY created_at DESC
      `;
      return rows.map(mapSuggestion);
    },

    async adminUpdateSuggestion(id, patch, moderatorId) {
      const rows = await sql`SELECT * FROM episode_suggestions WHERE id = ${id}`;
      if (!rows[0]) throw new Error("Sugestão não encontrada.");
      const status = patch.status ?? (rows[0].status as EpisodeSuggestion["status"]);
      const memberMessage = patch.memberMessage ?? (rows[0].member_message as string | null) ?? undefined;
      const internalNote = patch.internalNote ?? (rows[0].internal_note as string | null) ?? undefined;
      await sql`
        UPDATE episode_suggestions
        SET status = ${status}, member_message = ${memberMessage ?? null},
            internal_note = ${internalNote ?? null}, updated_at = NOW()
        WHERE id = ${id}
      `;
      await audit(moderatorId, "suggestion_update", "suggestion", id, patch.status);
      const updated = await sql`SELECT * FROM episode_suggestions WHERE id = ${id}`;
      return mapSuggestion(updated[0]);
    },
  };
}

function mapSuggestion(r: Record<string, unknown>): EpisodeSuggestion {
  const links = r.source_links;
  return {
    id: r.id as string,
    protocol: r.protocol as string,
    authorId: r.author_id as string,
    caseTitle: r.case_title as string,
    location: (r.location as string) ?? undefined,
    summary: r.summary as string,
    relevance: r.relevance as string,
    sourceLinks: Array.isArray(links) ? (links as string[]) : JSON.parse(String(links ?? "[]")),
    sensitiveContent: r.sensitive_content as boolean,
    noPrivateDataConfirmed: r.no_private_data_confirmed as boolean,
    status: r.status as EpisodeSuggestion["status"],
    memberMessage: (r.member_message as string) ?? undefined,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapNotification(r: Record<string, unknown>): CommunityNotification {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as string,
    title: r.title as string,
    body: r.body as string,
    linkHref: (r.link_href as string) ?? undefined,
    readAt: r.read_at ? (r.read_at as Date).toISOString() : undefined,
    createdAt: (r.created_at as Date).toISOString(),
  };
}
