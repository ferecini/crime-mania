import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { DEFAULT_CATEGORIES } from "@/lib/community/categories-seed";
import type { CommunityRepository } from "@/lib/community/repository";
import type {
  CommunityCategory,
  CommunityNotification,
  CommunityReply,
  CommunityTopic,
  EpisodeSuggestion,
} from "@/lib/community/types";

type DbShape = {
  categories: CommunityCategory[];
  rulesAcceptance: { userId: string; rulesVersion: number; acceptedAt: string }[];
  topics: CommunityTopic[];
  replies: CommunityReply[];
  reports: {
    id: string;
    targetType: string;
    targetId: string;
    reporterId: string;
    reason: string;
    detail?: string;
    status: string;
    createdAt: string;
  }[];
  notifications: CommunityNotification[];
  audit: {
    id: string;
    moderatorId: string;
    action: string;
    targetType: string;
    targetId: string;
    reason?: string;
    createdAt: string;
  }[];
  restrictions: { userId: string; restrictedUntil: string; reason: string; createdAt: string }[];
  suggestions: (EpisodeSuggestion & { internalNote?: string })[];
  rateEvents: { id: string; userId: string; action: string; createdAt: string }[];
};

function dbPath(): string {
  return process.env.CM_COMMUNITY_STORE_PATH ?? path.join(process.cwd(), "private/data/community-db.json");
}

function emptyDb(): DbShape {
  return {
    categories: [...DEFAULT_CATEGORIES],
    rulesAcceptance: [],
    topics: [],
    replies: [],
    reports: [],
    notifications: [],
    audit: [],
    restrictions: [],
    suggestions: [],
    rateEvents: [],
  };
}

function readDb(): DbShape {
  const p = dbPath();
  if (!fs.existsSync(p)) {
    const dir = path.dirname(p);
    fs.mkdirSync(dir, { recursive: true });
    const db = emptyDb();
    fs.writeFileSync(p, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as DbShape;
}

function writeDb(db: DbShape): void {
  const p = dbPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(db, null, 2));
}

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

export function createFileCommunityRepository(): CommunityRepository {
  return {
    async ensureReady() {
      readDb();
    },

    async listCategories() {
      const db = readDb();
      if (!db.categories.length) {
        db.categories = [...DEFAULT_CATEGORIES];
        writeDb(db);
      }
      return db.categories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async hasAcceptedRules(userId, version) {
      const db = readDb();
      return db.rulesAcceptance.some((r) => r.userId === userId && r.rulesVersion === version);
    },

    async acceptRules(userId, version) {
      const db = readDb();
      if (!db.rulesAcceptance.some((r) => r.userId === userId && r.rulesVersion === version)) {
        db.rulesAcceptance.push({ userId, rulesVersion: version, acceptedAt: nowIso() });
        writeDb(db);
      }
    },

    async listTopics(params) {
      const db = readDb();
      const limit = Math.min(params.limit ?? 20, 50);
      let list = db.topics.filter((t) => t.status === "open" || t.status === "closed");
      if (params.categoryId) list = list.filter((t) => t.categoryId === params.categoryId);
      list.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.lastActivityAt.localeCompare(a.lastActivityAt);
      });
      let start = 0;
      if (params.cursor) {
        const idx = list.findIndex((t) => t.id === params.cursor);
        start = idx >= 0 ? idx + 1 : 0;
      }
      const slice = list.slice(start, start + limit);
      const nextCursor = start + limit < list.length ? slice[slice.length - 1]?.id : undefined;
      const cats = new Map(db.categories.map((c) => [c.id, c.label]));
      const topics = slice.map((t) => ({ ...t, categoryLabel: cats.get(t.categoryId) }));
      return { topics, nextCursor };
    },

    async getTopic(id) {
      const db = readDb();
      const t = db.topics.find((x) => x.id === id);
      if (!t) return null;
      const cat = db.categories.find((c) => c.id === t.categoryId);
      return { ...t, categoryLabel: cat?.label };
    },

    async createTopic(input) {
      const db = readDb();
      const ts = nowIso();
      const topic: CommunityTopic = {
        id: randomUUID(),
        title: input.title,
        body: input.body,
        categoryId: input.categoryId,
        authorId: input.authorId,
        status: "open",
        isPinned: false,
        replyCount: 0,
        lastActivityAt: ts,
        createdAt: ts,
        updatedAt: ts,
      };
      db.topics.push(topic);
      writeDb(db);
      return topic;
    },

    async updateTopicOwn(id, authorId, patch) {
      const db = readDb();
      const t = db.topics.find((x) => x.id === id);
      if (!t) throw new Error("Tópico não encontrado.");
      if (t.authorId !== authorId) throw new Error("Sem permissão.");
      if (t.status === "removed" || t.status === "hidden") throw new Error("Tópico indisponível.");
      if (patch.title) t.title = patch.title;
      if (patch.body) t.body = patch.body;
      t.updatedAt = nowIso();
      writeDb(db);
      return t;
    },

    async listReplies(topicId) {
      const db = readDb();
      return db.replies
        .filter((r) => r.topicId === topicId && r.status === "visible")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async createReply(input) {
      const db = readDb();
      const topic = db.topics.find((t) => t.id === input.topicId);
      if (!topic) throw new Error("Tópico não encontrado.");
      if (topic.status !== "open") throw new Error("Tópico fechado para respostas.");
      const ts = nowIso();
      const reply: CommunityReply = {
        id: randomUUID(),
        topicId: input.topicId,
        authorId: input.authorId,
        body: input.body,
        status: "visible",
        createdAt: ts,
        updatedAt: ts,
      };
      db.replies.push(reply);
      topic.replyCount += 1;
      topic.lastActivityAt = ts;
      topic.updatedAt = ts;
      writeDb(db);
      return reply;
    },

    async updateReplyOwn(id, authorId, body) {
      const db = readDb();
      const r = db.replies.find((x) => x.id === id);
      if (!r) throw new Error("Resposta não encontrada.");
      if (r.authorId !== authorId) throw new Error("Sem permissão.");
      if (r.status !== "visible") throw new Error("Resposta indisponível.");
      r.body = body;
      r.updatedAt = nowIso();
      writeDb(db);
      return r;
    },

    async createReport(input) {
      const db = readDb();
      db.reports.push({
        id: randomUUID(),
        targetType: input.targetType,
        targetId: input.targetId,
        reporterId: input.reporterId,
        reason: input.reason,
        detail: input.detail,
        status: "pending",
        createdAt: nowIso(),
      });
      writeDb(db);
    },

    async countRecentActions(userId, action, sinceMs) {
      const db = readDb();
      const since = Date.now() - sinceMs;
      return db.rateEvents.filter(
        (e) => e.userId === userId && e.action === action && new Date(e.createdAt).getTime() >= since,
      ).length;
    },

    async recordAction(userId, action) {
      const db = readDb();
      db.rateEvents.push({ id: randomUUID(), userId, action, createdAt: nowIso() });
      writeDb(db);
    },

    async createSuggestion(input) {
      const db = readDb();
      const ts = nowIso();
      const suggestion: EpisodeSuggestion & { internalNote?: string } = {
        id: randomUUID(),
        protocol: protocolFromDate(),
        authorId: input.authorId,
        caseTitle: input.caseTitle,
        location: input.location,
        summary: input.summary,
        relevance: input.relevance,
        sourceLinks: input.sourceLinks,
        sensitiveContent: input.sensitiveContent,
        noPrivateDataConfirmed: input.noPrivateDataConfirmed,
        status: input.status,
        memberMessage: input.memberMessage,
        createdAt: ts,
        updatedAt: ts,
      };
      db.suggestions.push(suggestion);
      writeDb(db);
      const { internalNote: _, ...pub } = suggestion;
      void _;
      return pub;
    },

    async listSuggestionsByAuthor(authorId) {
      const db = readDb();
      return db.suggestions
        .filter((s) => s.authorId === authorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ internalNote, ...s }) => {
          void internalNote;
          return s;
        });
    },

    async findSimilarSuggestions(caseTitle, excludeAuthorId) {
      const db = readDb();
      const needle = caseTitle.trim().toLowerCase().slice(0, 40);
      if (needle.length < 4) return [];
      return db.suggestions
        .filter(
          (s) =>
            s.authorId !== excludeAuthorId &&
            s.caseTitle.toLowerCase().includes(needle.slice(0, Math.min(needle.length, 20))),
        )
        .slice(0, 5)
        .map(({ internalNote, ...s }) => {
          void internalNote;
          return s;
        });
    },

    async listNotifications(userId) {
      const db = readDb();
      return db.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50);
    },

    async markNotificationRead(userId, id) {
      const db = readDb();
      const n = db.notifications.find((x) => x.id === id && x.userId === userId);
      if (n && !n.readAt) {
        n.readAt = nowIso();
        writeDb(db);
      }
    },

    async createNotification(input) {
      const db = readDb();
      db.notifications.push({
        id: randomUUID(),
        ...input,
        createdAt: nowIso(),
      });
      writeDb(db);
    },

    async searchTopics(query, limit) {
      const db = readDb();
      const q = query.toLowerCase();
      return db.topics
        .filter(
          (t) =>
            (t.status === "open" || t.status === "closed") &&
            (t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)),
        )
        .slice(0, limit);
    },

    async modSetTopicPinned(id, pinned, moderatorId, reason) {
      const db = readDb();
      const t = db.topics.find((x) => x.id === id);
      if (!t) throw new Error("Tópico não encontrado.");
      t.isPinned = pinned;
      t.updatedAt = nowIso();
      db.audit.push({
        id: randomUUID(),
        moderatorId,
        action: pinned ? "pin_topic" : "unpin_topic",
        targetType: "topic",
        targetId: id,
        reason,
        createdAt: nowIso(),
      });
      writeDb(db);
    },

    async modSetTopicStatus(id, status, moderatorId, reason) {
      const db = readDb();
      const t = db.topics.find((x) => x.id === id);
      if (!t) throw new Error("Tópico não encontrado.");
      t.status = status;
      t.updatedAt = nowIso();
      db.audit.push({
        id: randomUUID(),
        moderatorId,
        action: `topic_status_${status}`,
        targetType: "topic",
        targetId: id,
        reason,
        createdAt: nowIso(),
      });
      writeDb(db);
    },

    async modSetReplyStatus(id, status, moderatorId, reason) {
      const db = readDb();
      const r = db.replies.find((x) => x.id === id);
      if (!r) throw new Error("Resposta não encontrada.");
      r.status = status;
      r.updatedAt = nowIso();
      const topic = db.topics.find((t) => t.id === r.topicId);
      if (topic && status !== "visible") {
        topic.replyCount = Math.max(0, topic.replyCount - 1);
      }
      db.audit.push({
        id: randomUUID(),
        moderatorId,
        action: `reply_status_${status}`,
        targetType: "reply",
        targetId: id,
        reason,
        createdAt: nowIso(),
      });
      writeDb(db);
    },

    async listPendingReports() {
      const db = readDb();
      return db.reports.filter((r) => r.status === "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async adminListSuggestions() {
      const db = readDb();
      return db.suggestions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async adminUpdateSuggestion(id, patch, moderatorId) {
      const db = readDb();
      const s = db.suggestions.find((x) => x.id === id);
      if (!s) throw new Error("Sugestão não encontrada.");
      if (patch.status) s.status = patch.status;
      if (patch.memberMessage !== undefined) s.memberMessage = patch.memberMessage;
      if (patch.internalNote !== undefined) s.internalNote = patch.internalNote;
      s.updatedAt = nowIso();
      db.audit.push({
        id: randomUUID(),
        moderatorId,
        action: "suggestion_update",
        targetType: "suggestion",
        targetId: id,
        reason: patch.status,
        createdAt: nowIso(),
      });
      writeDb(db);
      const { internalNote: _, ...pub } = s;
      void _;
      return pub;
    },
  };
}
