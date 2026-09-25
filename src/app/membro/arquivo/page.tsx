import Image from "next/image";
import { PaywallCard } from "@/components/member/PaywallCard";
import { PUBLIC_EPISODES } from "@/data/episodes";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Arquivo" };

export default async function ArchivePage() {
  const session = await getSession();
  const access = evaluateAccess(session, "archive");
  const preview = PUBLIC_EPISODES[1];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-white">Arquivo</h1>
      <p className="max-w-2xl text-cm-gray">
        Casos não públicos, disponíveis somente em áudio para assinantes Tier 2.
      </p>
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : (
        <div className="cm-panel overflow-hidden p-0">
          <div className="relative h-40">
            <Image src={preview.coverImage} alt="" fill className="object-cover opacity-60" sizes="800px" />
          </div>
          <div className="p-6">
            <p className="text-sm text-cm-gray">
              O catálogo premium em áudio está sendo migrado para esta área. Em breve você verá fichas
              com player protegido por episódio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
