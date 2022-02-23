export type GameState = 'PREPARING' | 'PLAYING' | 'COMPLETED'

export default interface Game {
    id: string,
    name: string,
    currentPlayersCount: number,
    maxPlayersCount: number,
    state: GameState
}