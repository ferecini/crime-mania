import { redirect } from "next/navigation";
import { PreferredNameForm } from "@/components/auth/PreferredNameForm";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/users-store";
import { firstNameFromFullName } from "@/lib/auth/display-name";

export const metadata = { title: "Como podemos te chamar?" };

export default async function PreferredNameOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/entrar?next=/membro/onboarding/nome");

  const user = getUserById(session.id);
  if (user?.preferredName && !user.needsPreferredNameConfirm) {
    redirect("/membro");
  }

  const { next = "/membro" } = await searchParams;
  const suggestion = firstNameFromFullName(user?.legalName ?? session.displayName);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="font-display text-2xl text-white">Bem-vindo à Central do Maníaco</h1>
        <p className="mt-2 text-sm text-cm-gray">
          Escolha como prefere ser chamado nas saudações e na comunidade.
        </p>
      </header>
      <div className="cm-panel p-6">
        <PreferredNameForm initialValue={suggestion} nextPath={next} submitLabel="Continuar" />
      </div>
    </div>
  );
}
