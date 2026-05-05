/** A puzzle resource as returned by the API (template-filtered optional fields). */
export interface Puzzle {
  id: string;
  collectionId: string;
  sortOrder: number;
  title: string;
  status: string;
  workingOnId: string | null;
  checkerUrl: string | null;
  updatedAt: string;
  gcCode?: string | null;
  difficulty?: number | null;
  terrain?: number | null;
  coords?: string | null;
  hint?: string | null;
  spoiler?: string | null;
  customFields?: unknown;
}

/** Valid forward-only status transitions. */
export const STATUS_NEXT: Record<string, string | null> = {
  open: 'in_progress',
  in_progress: 'solved',
  solved: 'verified',
  verified: null,
};

/** Human-readable status labels. */
export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  solved: 'Solved',
  verified: 'Verified',
};
