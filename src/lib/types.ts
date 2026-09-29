export type WorkDTO = {
  id: string;
  studentName: string;
  expectationUrl: string;
  realityUrl: string;
};

export type ResultRow = WorkDTO & {
  rank: number;
  points: number;
  firsts: number;
  seconds: number;
  thirds: number;
};

export type ResultsPayload = {
  hidden: boolean;
  totalVotes: number;
  rows: ResultRow[];
  updatedAt: string;
};

export type VoteStatus = {
  hasVoted: boolean;
  votingOpen: boolean;
  totalVotes: number;
  picks: { points: number; studentName: string }[];
};

/** Puntos por posición: índice 0 = 1º lugar. */
export const POINTS = [3, 2, 1] as const;
