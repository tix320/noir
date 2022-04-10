import { Arena, GameState, RoleSelection } from "../game/Game";
import { RoleType } from "../game/RoleType";

export namespace Dto {

    export interface GamePreparation {
        id: string,
        name: string,
        maxPlayersCount: number,
        roles: RoleSelection<User>[],
        started?: boolean
    }

    export interface UserCurrentGame {
        id: string;
        state: GameState;
    }

    export interface User {
        id: string,
        name: string
    }

    export interface Player {
        identity: User,
        role: RoleType
    }

    export interface GameInitialState {
        players: Player[];
        arena: Arena;
    }
}

