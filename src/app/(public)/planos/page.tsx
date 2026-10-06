import { PlansPageContent } from "@/components/member/PlansPageContent";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Planos" };

export default async function PublicPlansPage() {
  const session = await getSession();
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container">
        <PlansPageContent session={session} />
      </div>
    </div>
  );
}
