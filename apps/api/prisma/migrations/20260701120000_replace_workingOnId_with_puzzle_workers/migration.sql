-- Drop the single-user claim column
ALTER TABLE "Puzzle" DROP COLUMN "workingOnId";

-- Create the PuzzleWorker join table
CREATE TABLE "PuzzleWorker" (
    "puzzleId" TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuzzleWorker_pkey" PRIMARY KEY ("puzzleId","userId")
);

-- Foreign keys
ALTER TABLE "PuzzleWorker" ADD CONSTRAINT "PuzzleWorker_puzzleId_fkey"
    FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PuzzleWorker" ADD CONSTRAINT "PuzzleWorker_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
