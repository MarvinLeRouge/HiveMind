/** An attempt resource as returned by the API. Attempts are immutable after creation. */
export interface Attempt {
  id: string;
  puzzleId: string;
  userId: string;
  valueTested: string;
  checkerResult: boolean;
  comment: string | null;
  createdAt: string;
}
