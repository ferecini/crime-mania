import { getUserById } from "@/lib/auth/users-store";

/** Contexto da sessão JWT quando o users-store em disco não tem o usuário (OAuth no Vercel). */
export type BillingSessionContext = {
  isTestUser?: boolean;
  email?: string;
};

export function assertBillingAccountAllowed(
  userId: string,
  session?: BillingSessionContext | null,
): void {
  if (session?.isTestUser === true) {
    throw new Error("Contas de QA não usam cobrança real.");
  }

  const user = getUserById(userId);
  if (user?.isTestUser) {
    throw new Error("Contas de QA não usam cobrança real.");
  }
  if (user) return;

  const email = session?.email?.trim();
  if (email) {
    return;
  }

  throw new Error(
    "Conta não encontrada no cadastro. Saia e entre de novo; se persistir, contate o suporte.",
  );
}
