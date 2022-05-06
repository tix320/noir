import { Character } from "../game/Character";
import { GameState, Marker } from "../game/Game";
import { GameActions } from "../game/GameActions";
import { GameEvents } from "../game/GameEvents";
import { Role } from "../game/Role";
import Identifiable from "../util/Identifiable";
import PositionObj from "../util/Position";
import { ReplaceByType } from "../util/Types";

export namespace Dto {

    export interface GamePreparation {
        id: string,
        name: string,
        maxPlayersCount: number,
        roles: GameRoleSelection[],
        started?: boolean
    }

    export type GameRoleSelection = {
        identity: User,
        role: Role['name'] | undefined,
        ready: boolean
    }

    export interface UserCurrentGame {
        id: string;
        state: GameState;
    }

    export interface User {
        id: string,
        name: string,
    }

    export interface Player {
        identity: User,
        role: Role['name']
    }

    export type SuspectRole = Player | 'suspect' | 'innocent' | 'arrested' | 'killed'

    export interface Suspect {
        character: Character,
        role: SuspectRole,
        markers: Marker[]
    }

    export type Arena = Suspect[][];

    export interface Position {
        x: number;
        y: number;
    }

    export namespace Events {
        export type Started = Omit<GameEvents.Started<User>, 'players' | 'arena'> & {
            players: Player[],
            arena: Arena
        };

        export type AvailableActionsChanged = {
            type: 'AvailableActionsChanged',
            actions: GameActions.Key[]
        };

        type ChangedAny = ReplaceByType<ReplaceByType<ReplaceByType<ReplaceByType<GameEvents.Any, PositionObj, Position>, Role, Role['name']>, Character, Character['name']>, Identifiable, User>;

        export type Any =
            Exclude<ChangedAny,
                | GameEvents.Started<any>
                | GameEvents.AvailableActionsChanged>
            | Started
            | AvailableActionsChanged;
    }

    export type Action = ReplaceByType<ReplaceByType<ReplaceByType<GameActions.Any, PositionObj, Position>, Role, Role['name']>, Character, Character['name']>;
}