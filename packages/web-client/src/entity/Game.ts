import {GameMode} from '@tix320/noir-core';

export interface Game {
    id: string,
    mode: GameMode,
    currentPlayersCount: number,
    maxPlayersCount: number,
}