export type Round = 'first-round' | 'second-round' | 'third-round' | 'eighth-finals' | 'quarter-finals' | 'semi-finals' | 'final';

export interface BetsResponse {
    id: string;
    team1: string;
    team2: string;
    score1: number;
    score2: number;
    editable: boolean;
    points: number;
    round: Round;
}

export interface BetsRequest {
    id: string;
    score1: number;
    score2: number;
}