import { redirect } from "next/navigation";

/** Planos são públicos em /planos; mantém URL antiga para quem já está logado. */
export default function MemberPlansRedirect() {
  redirect("/planos");
}
