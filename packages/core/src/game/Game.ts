import { Observable } from "rxjs";
import Identifiable from "../util/Identifiable";
import Matrix from "../util/Matrix";
import Position from "../util/Position";
import { GameActions } from "./GameActions";
import { GameEvents } from "./GameEvents";
import { RoleType } from "./RoleType";
import { Suspect } from "./Suspect";

export type GameState = 'PREPARING' | 'PLAYING' | 'COMPLETED';

export type Team = 'FBI' | 'MAFIA';

export type Winner = Team | 'DRAW';

export type Arena = Matrix<Suspect>;
export type EvidenceDeck = Suspect[];

export namespace Game {

    export interface Preparation<I extends Identifiable> {
        get participants(): RoleSelection<I>[];

        join(identity: I): void;

        changeRole(selection: RoleSelection<I>): void;

        leave(identity: I): void;

        // As first item will be supplied current participants
        participantChanges(): Observable<RoleSelection<I>[]>;

        start(): Game.Play<I> | undefined;

        isStarted(): boolean;
    }

    export interface Play<I extends Identifiable> {
        get initialState(): InitialState<I>;

        events(): Observable<GameEvents.Base>;
    }
}

export type RoleSelection<I extends Identifiable> =
    { readonly identity: I }
    &
    (PlayerRoleUnreadySelection<I> | PlayerRoleReadySelection<I>)

export interface PlayerRoleUnreadySelection<I> {
    readonly role?: RoleType,
    ready: false
}

export interface PlayerRoleReadySelection<I> {
    readonly role: RoleType,
    ready: true
}

export interface InitialState<I extends Identifiable> {
    readonly players: Player<I>[];
    readonly arena: Arena;
    readonly evidenceDeck: EvidenceDeck;
}

export interface Player<I extends Identifiable> {
    readonly identity: I;
    readonly role: RoleType;

    locate(): Position;

    gameEvents(): Observable<GameEvents.Base>;
}

export interface Mafioso<I extends Identifiable> extends Player<I> {
}

export interface Agent<I extends Identifiable> extends Player<I> {
}

export interface Killer<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.KILLER;

    doAction<T extends GameActions.Key<GameActions.OfKiller>>(key: T, data: GameActions.Params<T>): void;
}

export interface Psycho<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.PSYCHO;

    doAction<T extends GameActions.Key<GameActions.OfPsycho>>(key: T, data: GameActions.Params<T>): void;
}

export interface Bomber<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.BOMBER;

    doAction<T extends GameActions.Key<GameActions.OfBomber>>(key: T, data: GameActions.Params<T>): void;
}

export interface Sniper<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.SNIPER;

    doAction<T extends GameActions.Key<GameActions.OfSniper>>(key: T, data: GameActions.Params<T>): void;
}

export interface Undercover<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.UNDERCOVER;

    doAction<T extends GameActions.Key<GameActions.OfUndercover>>(key: T, data: GameActions.Params<T>): void;
}

export interface Detective<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.DETECTIVE;

    doAction<T extends GameActions.Key<GameActions.OfDetective>>(key: T, data: GameActions.Params<T>): void;
}

export interface Suit<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.SUIT;

    doAction<T extends GameActions.Key<GameActions.OfSuit>>(key: T, data: GameActions.Params<T>): void;
}

export interface Profiler<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.PROFILER;

    doAction<T extends GameActions.Key<GameActions.OfProfiler>>(key: T, data: GameActions.Params<T>): void;
}

export function filterPlayersByTeam<I extends Identifiable>(game: Game.Play<I>, team: Team): Player<I>[] {
    const arr = team === 'MAFIA' ? RoleType.MAFIA_TEAM : RoleType.FBI_TEAM;
    return game.initialState.players.filter(player => arr.includes(player.role));
}

export function findPlayerByRole<I extends Identifiable>(game: Game.Play<I>, role: RoleType): Player<I> | undefined {
    return game.initialState.players.find(player => player.role === role);
}