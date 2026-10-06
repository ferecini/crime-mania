import type { CommunityCategory } from "@/lib/community/types";

export const DEFAULT_CATEGORIES: CommunityCategory[] = [
  { id: "cat-casos", slug: "casos-episodios", label: "Casos e episódios", sortOrder: 1, active: true },
  { id: "cat-teorias", slug: "teorias", label: "Teorias e investigação", sortOrder: 2, active: true },
  { id: "cat-juris", slug: "juris", label: "Crime Mania Juris", sortOrder: 3, active: true },
  { id: "cat-rec", slug: "recomendacoes", label: "Recomendações", sortOrder: 4, active: true },
  { id: "cat-com", slug: "comunidade", label: "Comunidade", sortOrder: 5, active: true },
];
