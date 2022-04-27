import { Observable } from "rxjs";
import { Direction } from "../util/Direction";
import Identifiable from "../util/Identifiable";
import Matrix from "../util/Matrix";
import { Character } from "./Character";
import { GameActions } from "./GameActions";
import { GameEvents } from "./GameEvents";
import { Role } from "./Role";

export type GameState = 'PREPARING' | 'PLAYING' | 'COMPLETED';

export type Team = 'FBI' | 'MAFIA';

export type Winner = Team | 'DRAW';

export type Score = [number, number];

export type SuspectRole<I extends Identifiable> = Player<I> | 'suspect' | 'innocent' | 'arrested' | 'killed';

export type Arena<I extends Identifiable = Identifiable> = Matrix<Suspect<I>>;

export class AccessDeniedError extends Error {
}

export enum Marker {
    BOMB = 'BOMB',
    THREAT = 'THREAT',
    PROTECTION = 'PROTECTION'
}

export interface ShiftAction {
    readonly direction: Direction;
    readonly index: number;
}

export interface Suspect<I extends Identifiable = Identifiable> {
    readonly character: Character;

    /**
     * @throws {AccessDeniedError}
     */
    get role(): SuspectRole<I>;

    markersSnapshot(): Marker[];
    hasMarker(marker: Marker): boolean;
    isAlive(): boolean; // neither killed nor arrested
    isPlayerOrSuspect(): boolean; // neither alive nor innocent
}

export type RoleSelection<I extends Identifiable> =
    { readonly identity: I }
    &
    (PlayerRoleUnreadySelection | PlayerRoleReadySelection)

export interface PlayerRoleUnreadySelection {
    readonly role?: Role,
    ready: false
}

export interface PlayerRoleReadySelection {
    readonly role: Role,
    ready: true
}

export interface PlayerInfo<I extends Identifiable = Identifiable> {
    identity: I;
    role: Role;
}

export interface GameInitialState<I extends Identifiable> {
    players: PlayerInfo<I>[];
    arena: Matrix<Character>;
    evidenceDeck: Character[];
}

export namespace Game {

    export interface Preparation<I extends Identifiable> {
        getParticipants(): RoleSelection<I>[];

        join(identity: I): void;

        changeRole(selection: RoleSelection<I>): void;

        leave(identity: I): void;

        // As first item will be supplied current participants
        participantChanges(): Observable<RoleSelection<I>[]>;

        start(): Game.Play<I> | undefined;

        isStarted(): boolean;
    }

    export interface Play<I extends Identifiable> {
        readonly initialState: GameInitialState<I>;
        
        readonly players: Player<I>[];

        events(): Observable<GameEvents.Any<I>>;
    }
}

export interface Player<I extends Identifiable = Identifiable, A extends GameActions.Any = GameActions.Any> {
    readonly identity: I;
    readonly role: Role<A>;

    doAction(action: A): Promise<void>;

    gameEvents(): Observable<GameEvents.Any<I>>;
}
