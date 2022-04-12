import { Character } from "../game/Character";
import { GameState, RoleSelection } from "../game/Game";
import { Marker } from "../game/Marker";
import { RoleType } from "../game/RoleType";
import Matrix from "../util/Matrix";

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

    export type SuspectRole = Player | 'suspect' | 'innocent' | 'arrested' | 'killed'

    export interface Suspect {
        character: Character,
        role: SuspectRole,
        markers: Marker[]
    }

    export type Arena = Suspect[][]

    export interface GameInitialState {
        players: Player[];
        arena: Arena;
    }
}

