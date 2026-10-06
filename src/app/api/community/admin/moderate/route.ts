import { NextResponse } from "next/server";
import { z } from "zod";
import {
  communityRepo,
  jsonError,
  requireModerator,
} from "@/lib/community/api-helpers";
import { notifySuggestionStatus } from "@/lib/community/notifications";
import type { CommunityReplyStatus } from "@/lib/community/types";

const modSchema = z.object({
  action: z.enum([
    "pin_topic",
    "unpin_topic",
    "close_topic",
    "reopen_topic",
    "hide_topic",
    "restore_topic",
    "remove_topic",
    "hide_reply",
    "restore_reply",
    "remove_reply",
    "update_suggestion",
  ]),
  targetId: z.string().min(1),
  reason: z.string().max(500).optional(),
  suggestionStatus: z
    .enum(["received", "under_review", "needs_information", "accepted", "not_selected", "closed"])
    .optional(),
  memberMessage: z.string().max(1000).optional(),
  internalNote: z.string().max(4000).optional(),
});

export async function GET() {
  const auth = await requireModerator();
  if ("error" in auth) return auth.error;
  try {
    const repo = await communityRepo();
    const [reports, suggestions] = await Promise.all([
      repo.listPendingReports(),
      repo.adminListSuggestions(),
    ]);
    return NextResponse.json({ reports, suggestions });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireModerator();
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const parsed = modSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const repo = await communityRepo();
    const { action, targetId, reason } = parsed.data;
    const modId = auth.session.id;

    switch (action) {
      case "pin_topic":
        await repo.modSetTopicPinned(targetId, true, modId, reason);
        break;
      case "unpin_topic":
        await repo.modSetTopicPinned(targetId, false, modId, reason);
        break;
      case "close_topic":
        await repo.modSetTopicStatus(targetId, "closed", modId, reason);
        break;
      case "reopen_topic":
        await repo.modSetTopicStatus(targetId, "open", modId, reason);
        break;
      case "hide_topic":
        await repo.modSetTopicStatus(targetId, "hidden", modId, reason);
        break;
      case "restore_topic":
        await repo.modSetTopicStatus(targetId, "open", modId, reason);
        break;
      case "remove_topic":
        await repo.modSetTopicStatus(targetId, "removed", modId, reason);
        break;
      case "hide_reply":
        await repo.modSetReplyStatus(targetId, "hidden" satisfies CommunityReplyStatus, modId, reason);
        break;
      case "restore_reply":
        await repo.modSetReplyStatus(targetId, "visible", modId, reason);
        break;
      case "remove_reply":
        await repo.modSetReplyStatus(targetId, "removed", modId, reason);
        break;
      case "update_suggestion": {
        if (!parsed.data.suggestionStatus) {
          return NextResponse.json({ error: "Status obrigatório." }, { status: 400 });
        }
        const updated = await repo.adminUpdateSuggestion(
          targetId,
          {
            status: parsed.data.suggestionStatus,
            memberMessage: parsed.data.memberMessage,
            internalNote: parsed.data.internalNote,
          },
          modId,
        );
        if (parsed.data.suggestionStatus !== "received") {
          await notifySuggestionStatus(
            repo,
            updated.authorId,
            updated.protocol,
            parsed.data.suggestionStatus,
            parsed.data.memberMessage,
          );
        }
        break;
      }
      default:
        return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
