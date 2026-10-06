import type { DossierProcessingStatus } from "@/lib/dossier/types";

export type DossierJobRecord = {
  id: string;
  slug: string;
  status: DossierProcessingStatus;
  sourcePdfStorageKey: string;
  sha256: string;
  createdAt: string;
  updatedAt: string;
  requestedBy?: string;
  error?: string;
  version: number;
  attempts?: number;
  progress?: string;
};
