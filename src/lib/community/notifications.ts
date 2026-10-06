import type { CommunityRepository } from "@/lib/community/repository";
import { displayNameForMemberId } from "@/lib/community/member-display";

export async function notifyTopicParticipantsOnReply(
  repo: CommunityRepository,
  topicId: string,
  topicAuthorId: string,
  topicTitle: string,
  replyAuthorId: string,
  existingReplyAuthorIds: string[],
) {
  const recipients = new Set<string>();
  recipients.add(topicAuthorId);
  for (const id of existingReplyAuthorIds) recipients.add(id);
  recipients.delete(replyAuthorId);

  const name = displayNameForMemberId(replyAuthorId);
  const href = `/membro/comunidade/forum/${topicId}`;
  for (const userId of recipients) {
    await repo.createNotification({
      userId,
      type: "forum_reply",
      title: "Nova resposta no fórum",
      body: `${name} respondeu em «${topicTitle.slice(0, 80)}»`,
      linkHref: href,
    });
  }
}

export async function notifySuggestionStatus(
  repo: CommunityRepository,
  authorId: string,
  protocol: string,
  statusLabel: string,
  memberMessage?: string,
) {
  await repo.createNotification({
    userId: authorId,
    type: "suggestion_status",
    title: "Atualização da sua sugestão",
    body: memberMessage?.trim() || `Protocolo ${protocol}: ${statusLabel}`,
    linkHref: "/membro/comunidade/sugira/minhas",
  });
}
