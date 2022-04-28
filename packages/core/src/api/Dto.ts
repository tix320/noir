import { Character } from "../game/Character";
import { GameState, Marker, RoleSelection } from "../game/Game";
import { GameActions } from "../game/GameActions";
import { GameEvents } from "../game/GameEvents";
import { Role } from "../game/Role";
import Position from "../util/Position";

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

    export namespace Events {
        export type Started = Omit<GameEvents.Started<User>, 'players' | 'arena'> & {
            players: Player[],
            arena: Arena
        };

        export type TurnChanged = GameEvents.TurnChanged<User>;

        export type AvailableActionsChanged = {
            type: 'AvailableActionsChanged',
            actions: GameActions.Key[]
        };

        export type Accused = Omit<GameEvents.Accused, 'mafioso'> & {
            mafioso: Role['name']
        };

        export type UnsuccessfulAccused = Omit<GameEvents.UnsuccessfulAccused, 'mafioso'> & {
            mafioso: Role['name']
        };

        export type AutopsyCanvased = GameEvents.AutopsyCanvased<User>;
        export type AllCanvased = GameEvents.AllCanvased<User>;
        export type Profiled = GameEvents.Profiled<User>;

        export type Any = Exclude<GameEvents.Any,
            | GameEvents.Started<any>
            | GameEvents.TurnChanged
            | GameEvents.AvailableActionsChanged
            | GameEvents.Accused
            | GameEvents.AutopsyCanvased
            | GameEvents.AllCanvased
            | GameEvents.Profiled>
    }

    export namespace Actions {
        export type Accuse = Omit<GameActions.Common.Accuse, 'mafioso'> & { mafioso: Role['name'] }
        export type FarAccuse = Omit<GameActions.Detective.FarAccuse, 'mafioso'> & { mafioso: Role['name'] }
        export type Any = Exclude<GameActions.Any, GameActions.Common.Accuse | GameActions.Detective.FarAccuse> | Accuse | FarAccuse
    }
}