export type Round = 'first-round' | 'second-round' | 'third-round' | 'eighth-finals' | 'quarter-finals' | 'semi-finals' | 'final';

export function NumberOfRound(round: Round) {
  switch (round) {
    case 'first-round': return 1;
    case 'second-round': return 2;
    case 'third-round': return 3;
    case 'eighth-finals': return 4;
    case 'quarter-finals': return 5;
    case 'semi-finals': return 6;
    case 'final': return 7;
  }
}

export interface BetsResponse {
    id: string;
    team1: string;
    team2: string;
    score1: number | null;
    score2: number | null;
    real1: number;
    real2: number;
    editable: boolean;
    date: Date;
    points: number;
    round: Round;
}

export interface BetsRequest {
    id: string;
    score1: number;
    score2: number;
}