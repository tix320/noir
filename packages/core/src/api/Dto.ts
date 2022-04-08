import { GameState, RoleSelection } from "../game/Game";

export namespace Dto {

    export interface GamePreparation {
        id: string,
        name: string,
        maxPlayersCount: number,
        roles: RoleSelection<any>[]
    }

    export interface UserCurrentGame {
        id: string;
        state: GameState;
    }

    export interface User {
        id: string,
        name: string
    }
}

