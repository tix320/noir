import { Game } from "./Game";

export interface User {
    id: string,
    name: string,
    currentGame: Game
}