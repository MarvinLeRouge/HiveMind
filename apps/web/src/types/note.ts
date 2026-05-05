/** A note resource as returned by the API. */
export interface Note {
  id: string;
  puzzleId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
