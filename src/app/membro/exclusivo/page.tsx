import { redirect } from "next/navigation";

export default function LegacyExclusiveRedirect() {
  redirect("/membro/episodios");
}
