import { GameState } from '@tix320/noir-core';

export interface Game {
    id: string,
    name: string,
    currentPlayersCount: number,
    maxPlayersCount: number,
    state: GameState
}